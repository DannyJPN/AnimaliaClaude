using PziApi.Models;

namespace PziApi.CrossCutting.Tenant;

public interface ITenantContext
{
    string? CurrentTenantId { get; }
    Models.Tenant? CurrentTenant { get; }
    Task<Models.Tenant?> GetTenantAsync(string tenantId);
    Task<Models.Tenant?> GetTenantByDomainAsync(string domain);
    void SetCurrentTenant(string tenantId);
    void SetCurrentTenant(Models.Tenant tenant);
}