using PziApi.Models;

namespace PziApi.CrossCutting.Tenant;

/// <summary>
/// Service for managing tenant context within the application
/// </summary>
public interface ITenantContext
{
    int? TenantId { get; }
    string? TenantName { get; }
    Models.Tenant? CurrentTenant { get; }

    void SetTenant(int tenantId, string tenantName);
    void SetTenant(Models.Tenant tenant);
    bool HasTenant();
}

public class TenantContext : ITenantContext
{
    private int? _tenantId;
    private string? _tenantName;
    private Models.Tenant? _currentTenant;

    public int? TenantId => _tenantId;
    public string? TenantName => _tenantName;
    public Models.Tenant? CurrentTenant => _currentTenant;

    public void SetTenant(int tenantId, string tenantName)
    {
        _tenantId = tenantId;
        _tenantName = tenantName;
        _currentTenant = null; // Clear cached tenant object
    }

    public void SetTenant(Models.Tenant tenant)
    {
        _tenantId = tenant.Id;
        _tenantName = tenant.Name;
        _currentTenant = tenant;
    }

    public bool HasTenant()
    {
        return _tenantId.HasValue && _tenantId.Value > 0;
    }
}

/// <summary>
/// Extension methods for working with tenant context
/// </summary>
public static class TenantContextExtensions
{
    public static IQueryable<T> WhereTenant<T>(this IQueryable<T> query, ITenantContext tenantContext)
        where T : class, ITenantEntity
    {
        if (!tenantContext.HasTenant())
        {
            throw new InvalidOperationException("No tenant context available");
        }

        return query.Where(e => e.TenantId == tenantContext.TenantId);
    }

    public static void SetTenantId<T>(this T entity, ITenantContext tenantContext)
        where T : ITenantEntity
    {
        if (!tenantContext.HasTenant())
        {
            throw new InvalidOperationException("No tenant context available");
        }

        entity.TenantId = tenantContext.TenantId!.Value;
    }
}