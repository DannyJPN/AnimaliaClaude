using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.CrossCutting.Tenant;

public class TenantContext : ITenantContext
{
    private readonly PziDbContext _dbContext;
    private Models.Tenant? _currentTenant;
    private string? _currentTenantId;

    public TenantContext(PziDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public string? CurrentTenantId => _currentTenantId;

    public Models.Tenant? CurrentTenant => _currentTenant;

    public async Task<Models.Tenant?> GetTenantAsync(string tenantId)
    {
        if (string.IsNullOrEmpty(tenantId))
            return null;

        return await _dbContext.Tenants
            .Where(t => t.Id == tenantId && t.IsActive)
            .FirstOrDefaultAsync();
    }

    public async Task<Models.Tenant?> GetTenantByDomainAsync(string domain)
    {
        if (string.IsNullOrEmpty(domain))
            return null;

        return await _dbContext.Tenants
            .Where(t => t.Domain == domain && t.IsActive)
            .FirstOrDefaultAsync();
    }

    public void SetCurrentTenant(string tenantId)
    {
        _currentTenantId = tenantId;
        _currentTenant = null; // Will be lazy loaded when needed
    }

    public void SetCurrentTenant(Models.Tenant tenant)
    {
        _currentTenant = tenant;
        _currentTenantId = tenant.Id;
    }
}