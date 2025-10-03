using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;

namespace PziApi.CrossCutting.Tenant;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<TenantMiddleware> _logger;

    public TenantMiddleware(RequestDelegate next, ILogger<TenantMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext, PziDbContext dbContext)
    {
        // Skip tenant validation for health check, swagger, and authentication endpoints
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";
        if (path.StartsWith("/health") ||
            path.StartsWith("/swagger") ||
            path.StartsWith("/api/auth") ||
            path.StartsWith("/.well-known"))
        {
            await _next(context);
            return;
        }

        var tenantId = await ResolveTenantIdAsync(context, dbContext);

        if (!string.IsNullOrEmpty(tenantId))
        {
            var tenant = await dbContext.Tenants
                .Where(t => t.Id == tenantId && t.IsActive)
                .FirstOrDefaultAsync();

            if (tenant != null)
            {
                tenantContext.SetCurrentTenant(tenant);
                _logger.LogInformation("Tenant resolved and validated: {TenantId}", tenantId);
                await _next(context);
                return;
            }
            else
            {
                _logger.LogWarning("Tenant {TenantId} not found or inactive", tenantId);
            }
        }

        // No valid tenant - reject request
        _logger.LogError("Request rejected: No valid tenant context. Path: {Path}, User: {User}",
            context.Request.Path,
            context.User?.Identity?.Name ?? "Anonymous");

        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new
        {
            error = "Forbidden",
            message = "Valid tenant context is required. Please ensure your authentication token contains valid tenant information.",
            code = "TENANT_REQUIRED"
        });
    }

    private async Task<string?> ResolveTenantIdAsync(HttpContext context, PziDbContext dbContext)
    {
        // 1. Try to get tenant from JWT claims
        var tenantFromClaims = GetTenantFromClaims(context);
        if (!string.IsNullOrEmpty(tenantFromClaims))
        {
            // Verify tenant exists and is active
            var tenant = await dbContext.Tenants
                .Where(t => t.Id == tenantFromClaims && t.IsActive)
                .FirstOrDefaultAsync();
            if (tenant != null)
                return tenant.Id;
        }

        // 2. Try to resolve from email domain
        var email = context.User?.FindFirst(ClaimTypes.Email)?.Value;
        if (!string.IsNullOrEmpty(email))
        {
            var domain = email.Split('@').LastOrDefault();
            if (!string.IsNullOrEmpty(domain))
            {
                var tenant = await dbContext.Tenants
                    .Where(t => t.Domain == domain && t.IsActive)
                    .FirstOrDefaultAsync();
                if (tenant != null)
                    return tenant.Id;
            }
        }

        // 3. Try to resolve from host/subdomain
        var host = context.Request.Host.Host;
        if (!string.IsNullOrEmpty(host))
        {
            // Extract subdomain (e.g., "zoo-praha" from "zoo-praha.example.com")
            var parts = host.Split('.');
            if (parts.Length > 2)
            {
                var subdomain = parts[0];
                var tenant = await dbContext.Tenants
                    .Where(t => t.Id == subdomain && t.IsActive)
                    .FirstOrDefaultAsync();
                if (tenant != null)
                    return tenant.Id;
            }
        }

        return null;
    }

    private string? GetTenantFromClaims(HttpContext context)
    {
        var user = context.User;
        if (user == null || !user.Identity?.IsAuthenticated == true)
            return null;

        // Try multiple claim types for tenant information
        var tenantClaim = user.FindFirst("custom:tenant")?.Value
            ?? user.FindFirst("tenant")?.Value
            ?? user.FindFirst("org_name")?.Value
            ?? user.FindFirst("organization")?.Value;

        return tenantClaim;
    }
}