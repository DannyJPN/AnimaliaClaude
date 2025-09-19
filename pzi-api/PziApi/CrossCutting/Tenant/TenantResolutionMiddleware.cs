using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using System.Security.Claims;

namespace PziApi.CrossCutting.Tenant;

/// <summary>
/// Middleware to resolve and set tenant context from Auth0 JWT token
/// </summary>
public class TenantResolutionMiddleware : IMiddleware
{
    private readonly ITenantContext _tenantContext;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<TenantResolutionMiddleware> _logger;

    public TenantResolutionMiddleware(
        ITenantContext tenantContext,
        IServiceProvider serviceProvider,
        ILogger<TenantResolutionMiddleware> logger)
    {
        _tenantContext = tenantContext;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        // Skip tenant resolution for non-authenticated requests
        if (!context.User.Identity?.IsAuthenticated == true)
        {
            await next(context);
            return;
        }

        try
        {
            await ResolveTenantAsync(context.User);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to resolve tenant for user {User}",
                context.User.Identity.Name);

            context.Response.StatusCode = 403;
            await context.Response.WriteAsync("Unable to resolve tenant context");
            return;
        }

        await next(context);
    }

    private async Task ResolveTenantAsync(ClaimsPrincipal user)
    {
        // Get tenant claim from Auth0 token
        var tenantClaim = user.FindFirst("tenant")?.Value;

        if (string.IsNullOrEmpty(tenantClaim))
        {
            // If no tenant claim, try to determine from organization or email domain
            tenantClaim = await DetermineTenantFromUser(user);
        }

        if (string.IsNullOrEmpty(tenantClaim))
        {
            throw new InvalidOperationException("No tenant information found in user claims");
        }

        // Resolve tenant from database
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant = await dbContext.Tenants
            .Where(t => t.Name == tenantClaim && t.IsActive)
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            // Auto-create tenant if it doesn't exist and matches Auth0 org
            var orgId = user.FindFirst("org_id")?.Value;
            if (!string.IsNullOrEmpty(orgId) && orgId == tenantClaim)
            {
                tenant = await CreateTenantAsync(dbContext, tenantClaim, orgId, user);
            }
        }

        if (tenant == null)
        {
            throw new InvalidOperationException($"Tenant '{tenantClaim}' not found or inactive");
        }

        _tenantContext.SetTenant(tenant);

        _logger.LogDebug("Resolved tenant {TenantName} (ID: {TenantId}) for user {User}",
            tenant.Name, tenant.Id, user.Identity?.Name);
    }

    private async Task<string?> DetermineTenantFromUser(ClaimsPrincipal user)
    {
        // Try organization ID from Auth0
        var orgId = user.FindFirst("org_id")?.Value;
        if (!string.IsNullOrEmpty(orgId))
        {
            return orgId;
        }

        // Try to determine from email domain
        var email = user.FindFirst(ClaimTypes.Email)?.Value;
        if (!string.IsNullOrEmpty(email))
        {
            var domain = email.Split('@').LastOrDefault()?.ToLowerInvariant();

            // Map common email domains to tenant names
            return domain switch
            {
                "zoopraha.cz" or "prague-zoo.cz" => "zoo-praha",
                "zoobrno.cz" or "brno-zoo.cz" => "zoo-brno",
                _ => null
            };
        }

        return null;
    }

    private async Task<Models.Tenant> CreateTenantAsync(
        PziDbContext dbContext,
        string tenantName,
        string auth0OrgId,
        ClaimsPrincipal user)
    {
        var displayName = tenantName switch
        {
            "zoo-praha" => "Zoo Praha",
            "zoo-brno" => "Zoo Brno",
            _ => tenantName.Replace("-", " ").Replace("_", " ")
        };

        var subdomain = tenantName.ToLowerInvariant();

        var tenant = new Models.Tenant
        {
            Name = tenantName,
            DisplayName = displayName,
            Subdomain = subdomain,
            Auth0OrganizationId = auth0OrgId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            ModifiedAt = DateTime.UtcNow,
            ModifiedBy = user.Identity?.Name ?? "system"
        };

        dbContext.Tenants.Add(tenant);
        await dbContext.SaveChangesAsync();

        _logger.LogInformation("Auto-created tenant {TenantName} with ID {TenantId} for Auth0 org {Auth0OrgId}",
            tenant.Name, tenant.Id, auth0OrgId);

        return tenant;
    }
}