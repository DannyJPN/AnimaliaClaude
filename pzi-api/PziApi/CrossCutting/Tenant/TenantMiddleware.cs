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
        var tenantId = await ResolveTenantIdAsync(context, dbContext);

        if (!string.IsNullOrEmpty(tenantId))
        {
            tenantContext.SetCurrentTenant(tenantId);
            _logger.LogInformation("Tenant resolved: {TenantId}", tenantId);
        }
        else
        {
            // Set default tenant as fallback
            tenantContext.SetCurrentTenant("default");
            _logger.LogWarning("No tenant resolved, using default tenant");
        }

        await _next(context);
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