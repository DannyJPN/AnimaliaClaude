using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;

namespace PziApi.CrossCutting.Auth;

public class Auth0JwtValidationMiddleware : IMiddleware
{
  private readonly IConfiguration _configuration;
  private readonly ILogger<Auth0JwtValidationMiddleware> _logger;
  private readonly HttpClient _httpClient;
  private readonly IMemoryCache _memoryCache;
  private readonly TimeSpan _jwksCacheDuration = TimeSpan.FromMinutes(10);
  private const string JwksCacheKeyPrefix = "Auth0_JWKS_";

  public Auth0JwtValidationMiddleware(
    IConfiguration configuration,
    ILogger<Auth0JwtValidationMiddleware> logger,
    HttpClient httpClient,
    IMemoryCache memoryCache)
  {
    _configuration = configuration;
    _logger = logger;
    _httpClient = httpClient;
    _memoryCache = memoryCache;

    // Configure HttpClient timeout
    _httpClient.Timeout = TimeSpan.FromSeconds(30);
  }

  public async Task InvokeAsync(HttpContext context, RequestDelegate next)
  {
    var token = ExtractTokenFromRequest(context);

    if (string.IsNullOrEmpty(token))
    {
      // Check if API key authentication is being used as fallback
      var apiKey = context.Request.Headers["X-API-Key"].ToString();
      var apiKeys = _configuration.GetSection("Pzi:ApiKeys").Get<string[]>();

      var isApiKeyValid = !string.IsNullOrEmpty(apiKey)
        && apiKeys != null
        && apiKeys.Contains(apiKey);

      if (isApiKeyValid)
      {
        // Allow API key authentication for backward compatibility
        await next(context);
        return;
      }

      context.Response.StatusCode = 401;
      await context.Response.WriteAsync("Authorization token required");
      return;
    }

    try
    {
      var claimsPrincipal = await ValidateAuth0Token(token);
      if (claimsPrincipal == null)
      {
        context.Response.StatusCode = 401;
        await context.Response.WriteAsync("Invalid token");
        return;
      }

      // Set the user principal for authorization
      context.User = claimsPrincipal;
      await next(context);
    }
    catch (Exception ex)
    {
      var correlationId = context.TraceIdentifier;
      _logger.LogError(ex, "Token validation failed for request {CorrelationId}", correlationId);
      context.Response.StatusCode = 401;
      await context.Response.WriteAsync($"Token validation failed. Correlation ID: {correlationId}");
    }
  }

  private string? ExtractTokenFromRequest(HttpContext context)
  {
    var authHeader = context.Request.Headers["Authorization"].ToString();

    if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
    {
      return null;
    }

    return authHeader.Substring("Bearer ".Length).Trim();
  }

  private async Task<ClaimsPrincipal?> ValidateAuth0Token(string token)
  {
    var domain = _configuration["Auth0:Domain"];
    var audience = _configuration["Auth0:Audience"];

    if (string.IsNullOrEmpty(domain) || string.IsNullOrEmpty(audience))
    {
      _logger.LogError("Auth0 Domain or Audience not configured");
      return null;
    }

    try
    {
      // Get Auth0 public keys
      var jwks = await GetAuth0PublicKeys(domain);
      if (jwks == null)
      {
        _logger.LogError("Failed to retrieve Auth0 public keys");
        return null;
      }

      var tokenHandler = new JwtSecurityTokenHandler();
      var jsonToken = tokenHandler.ReadJwtToken(token);

      // Find the key that matches the token's kid
      var key = FindMatchingKey(jwks, jsonToken.Header.Kid);
      if (key == null)
      {
        _logger.LogError("No matching key found for token kid: {Kid}", jsonToken.Header.Kid);
        return null;
      }

      var validationParameters = new TokenValidationParameters
      {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = key,
        ValidateIssuer = true,
        ValidIssuer = $"https://{domain}/",
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5)
      };

      var principal = tokenHandler.ValidateToken(token, validationParameters, out _);

      // Add custom claims from Auth0 token
      var identity = new ClaimsIdentity(principal.Identity);

      // Extract Auth0 user information
      var sub = principal.FindFirst("sub")?.Value;
      var email = principal.FindFirst("email")?.Value;
      var name = principal.FindFirst("name")?.Value;

      // Extract custom claims for roles, permissions, and tenant
      var rolesClaim = principal.FindFirst("custom:roles");
      if (rolesClaim != null)
      {
        var roles = JsonSerializer.Deserialize<string[]>(rolesClaim.Value);
        if (roles != null)
        {
          foreach (var role in roles)
          {
            identity.AddClaim(new Claim(ClaimTypes.Role, role));
          }
        }
      }

      var permissionsClaim = principal.FindFirst("custom:permissions");
      if (permissionsClaim != null)
      {
        var permissions = JsonSerializer.Deserialize<string[]>(permissionsClaim.Value);
        if (permissions != null)
        {
          foreach (var permission in permissions)
          {
            identity.AddClaim(new Claim("permission", permission));
          }
        }
      }

      var tenantClaim = principal.FindFirst("custom:tenant");
      if (tenantClaim != null)
      {
        identity.AddClaim(new Claim("tenant", tenantClaim.Value));
      }

      // Add standard claims
      if (!string.IsNullOrEmpty(sub))
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, sub));
      if (!string.IsNullOrEmpty(email))
        identity.AddClaim(new Claim(ClaimTypes.Email, email));
      if (!string.IsNullOrEmpty(name))
        identity.AddClaim(new Claim(ClaimTypes.Name, name));

      return new ClaimsPrincipal(identity);
    }
    catch (SecurityTokenValidationException ex)
    {
      _logger.LogWarning(ex, "Auth0 token validation failed: {Message}", ex.Message);
      return null;
    }
    catch (SecurityTokenExpiredException ex)
    {
      _logger.LogWarning(ex, "Auth0 token has expired");
      return null;
    }
    catch (SecurityTokenInvalidSignatureException ex)
    {
      _logger.LogWarning(ex, "Auth0 token has invalid signature");
      return null;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Unexpected error validating Auth0 token for domain: {Domain}", domain);
      return null;
    }
  }

  private async Task<JsonWebKeySet?> GetAuth0PublicKeys(string domain)
  {
    var cacheKey = $"{JwksCacheKeyPrefix}{domain}";

    // Try to get from cache first
    if (_memoryCache.TryGetValue(cacheKey, out JsonWebKeySet? cachedJwks))
    {
      _logger.LogDebug("Retrieved JWKS from cache for domain: {Domain}", domain);
      return cachedJwks;
    }

    try
    {
      var jwksUri = $"https://{domain}/.well-known/jwks.json";
      _logger.LogDebug("Fetching JWKS from Auth0 for domain: {Domain}", domain);

      var response = await _httpClient.GetStringAsync(jwksUri);
      var jwks = new JsonWebKeySet(response);

      // Cache the JWKS with expiration
      _memoryCache.Set(cacheKey, jwks, new MemoryCacheEntryOptions
      {
        AbsoluteExpirationRelativeToNow = _jwksCacheDuration,
        Priority = CacheItemPriority.High,
        Size = 1
      });

      _logger.LogDebug("Cached JWKS for domain: {Domain} for {Duration} minutes",
        domain, _jwksCacheDuration.TotalMinutes);

      return jwks;
    }
    catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
    {
      _logger.LogError(ex, "Timeout while retrieving JWKS from Auth0 domain: {Domain}", domain);
      return null;
    }
    catch (HttpRequestException ex)
    {
      _logger.LogError(ex, "HTTP error while retrieving JWKS from Auth0 domain: {Domain}", domain);
      return null;
    }
    catch (Exception ex)
    {
      _logger.LogError(ex, "Failed to retrieve JWKS from Auth0 domain: {Domain}", domain);
      return null;
    }
  }

  private SecurityKey? FindMatchingKey(JsonWebKeySet jwks, string? kid)
  {
    if (string.IsNullOrEmpty(kid)) return null;

    var key = jwks.Keys.FirstOrDefault(k => k.Kid == kid);
    if (key == null) return null;

    if (key.Kty == "RSA")
    {
      return new RsaSecurityKey(key.ToRSA());
    }

    return null;
  }
}