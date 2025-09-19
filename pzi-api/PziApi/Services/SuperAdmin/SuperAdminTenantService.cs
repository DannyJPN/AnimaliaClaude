using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using PziApi.CrossCutting.Database;
using PziApi.Models;
using PziApi.CrossCutting.Permissions;

namespace PziApi.Services.SuperAdmin;

public class SuperAdminTenantService : ISuperAdminTenantService
{
    private readonly PziDbContext _dbContext;
    private readonly ISuperAdminAuditService _auditService;
    private readonly ILogger<SuperAdminTenantService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public SuperAdminTenantService(
        PziDbContext dbContext,
        ISuperAdminAuditService auditService,
        ILogger<SuperAdminTenantService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _auditService = auditService;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<(IEnumerable<Tenant> tenants, int totalCount)> GetTenantsAsync(
        string? searchTerm = null,
        bool? isActive = null,
        DateTime? createdAfter = null,
        DateTime? createdBefore = null,
        int page = 1,
        int pageSize = 50)
    {
        var query = _dbContext.Tenants.AsQueryable();

        if (!string.IsNullOrEmpty(searchTerm))
        {
            query = query.Where(t => t.Name.Contains(searchTerm) ||
                                   t.DisplayName.Contains(searchTerm) ||
                                   (t.Domain != null && t.Domain.Contains(searchTerm)));
        }

        if (isActive.HasValue)
            query = query.Where(t => t.IsActive == isActive.Value);

        if (createdAfter.HasValue)
            query = query.Where(t => t.CreatedAt >= createdAfter.Value);

        if (createdBefore.HasValue)
            query = query.Where(t => t.CreatedAt <= createdBefore.Value);

        var totalCount = await query.CountAsync();

        var tenants = await query
            .OrderBy(t => t.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (tenants, totalCount);
    }

    public async Task<Tenant?> GetTenantDetailsAsync(string tenantId, bool includeUsageStats = false)
    {
        var tenant = await _dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        return tenant;
    }

    public async Task<Tenant> CreateTenantAsync(
        string tenantId,
        string name,
        string displayName,
        string? domain = null,
        TenantConfiguration? configuration = null,
        TenantTheme? theme = null,
        TenantFeatures? features = null,
        string? performedBy = null)
    {
        // Validate tenant doesn't already exist
        var existingTenant = await _dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (existingTenant != null)
            throw new InvalidOperationException($"Tenant with ID '{tenantId}' already exists");

        // Validate domain uniqueness if provided
        if (!string.IsNullOrEmpty(domain))
        {
            var existingDomain = await _dbContext.Tenants
                .FirstOrDefaultAsync(t => t.Domain == domain);

            if (existingDomain != null)
                throw new InvalidOperationException($"Domain '{domain}' is already in use");
        }

        var tenant = new Tenant
        {
            Id = tenantId,
            Name = name,
            DisplayName = displayName,
            Domain = domain,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (configuration != null)
            tenant.SetConfiguration(configuration);

        if (theme != null)
            tenant.SetTheme(theme);

        if (features != null)
            tenant.SetFeatures(features);

        _dbContext.Tenants.Add(tenant);
        await _dbContext.SaveChangesAsync();

        await _auditService.LogOperationAsync(
            SuperAdminAuditOperations.TenantCreate,
            "Tenant",
            tenantId,
            performedBy ?? "system",
            GetCorrelationId(),
            null,
            JsonSerializer.Serialize(new { tenant.Name, tenant.DisplayName, tenant.Domain, tenant.IsActive }),
            $"Created tenant: {displayName}",
            severity: "Info"
        );

        _logger.LogInformation("Created tenant {TenantId} with name {TenantName}", tenantId, displayName);

        return tenant;
    }

    public async Task<Tenant?> UpdateTenantAsync(
        string tenantId,
        string? displayName = null,
        string? domain = null,
        bool? isActive = null,
        TenantConfiguration? configuration = null,
        TenantTheme? theme = null,
        TenantFeatures? features = null,
        string? performedBy = null)
    {
        var tenant = await _dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null)
            return null;

        var beforeData = JsonSerializer.Serialize(new
        {
            tenant.DisplayName,
            tenant.Domain,
            tenant.IsActive,
            Configuration = tenant.GetConfiguration(),
            Theme = tenant.GetTheme(),
            Features = tenant.GetFeatures()
        });

        // Validate domain uniqueness if changing
        if (!string.IsNullOrEmpty(domain) && domain != tenant.Domain)
        {
            var existingDomain = await _dbContext.Tenants
                .FirstOrDefaultAsync(t => t.Domain == domain && t.Id != tenantId);

            if (existingDomain != null)
                throw new InvalidOperationException($"Domain '{domain}' is already in use");
        }

        // Update properties
        if (!string.IsNullOrEmpty(displayName))
            tenant.DisplayName = displayName;

        if (domain != null) // Allow setting to null
            tenant.Domain = domain;

        if (isActive.HasValue)
            tenant.IsActive = isActive.Value;

        tenant.UpdatedAt = DateTime.UtcNow;

        if (configuration != null)
            tenant.SetConfiguration(configuration);

        if (theme != null)
            tenant.SetTheme(theme);

        if (features != null)
            tenant.SetFeatures(features);

        await _dbContext.SaveChangesAsync();

        var afterData = JsonSerializer.Serialize(new
        {
            tenant.DisplayName,
            tenant.Domain,
            tenant.IsActive,
            Configuration = tenant.GetConfiguration(),
            Theme = tenant.GetTheme(),
            Features = tenant.GetFeatures()
        });

        await _auditService.LogOperationAsync(
            SuperAdminAuditOperations.TenantUpdate,
            "Tenant",
            tenantId,
            performedBy ?? "system",
            GetCorrelationId(),
            beforeData,
            afterData,
            $"Updated tenant: {tenant.DisplayName}",
            severity: "Info"
        );

        _logger.LogInformation("Updated tenant {TenantId}", tenantId);

        return tenant;
    }

    public async Task<bool> SuspendTenantAsync(string tenantId, string reason, string performedBy)
    {
        var tenant = await _dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null)
            return false;

        var beforeData = JsonSerializer.Serialize(new { tenant.IsActive });

        tenant.IsActive = false;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        var afterData = JsonSerializer.Serialize(new { tenant.IsActive });

        await _auditService.LogOperationAsync(
            SuperAdminAuditOperations.TenantSuspend,
            "Tenant",
            tenantId,
            performedBy,
            GetCorrelationId(),
            beforeData,
            afterData,
            $"Suspended tenant: {reason}",
            severity: "Warning"
        );

        _logger.LogWarning("Suspended tenant {TenantId} - Reason: {Reason}", tenantId, reason);

        return true;
    }

    public async Task<bool> RestoreTenantAsync(string tenantId, string performedBy)
    {
        var tenant = await _dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null)
            return false;

        var beforeData = JsonSerializer.Serialize(new { tenant.IsActive });

        tenant.IsActive = true;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        var afterData = JsonSerializer.Serialize(new { tenant.IsActive });

        await _auditService.LogOperationAsync(
            SuperAdminAuditOperations.TenantRestore,
            "Tenant",
            tenantId,
            performedBy,
            GetCorrelationId(),
            beforeData,
            afterData,
            "Restored tenant from suspension",
            severity: "Info"
        );

        _logger.LogInformation("Restored tenant {TenantId}", tenantId);

        return true;
    }

    public async Task<bool> DeleteTenantAsync(string tenantId, string reason, string performedBy)
    {
        var tenant = await _dbContext.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId);

        if (tenant == null)
            return false;

        var beforeData = JsonSerializer.Serialize(new { tenant.IsActive, tenant.Name, tenant.DisplayName });

        // Soft delete by marking as inactive and updating name to indicate deletion
        tenant.IsActive = false;
        tenant.Name = $"[DELETED] {tenant.Name}";
        tenant.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        var afterData = JsonSerializer.Serialize(new { tenant.IsActive, tenant.Name, tenant.DisplayName });

        await _auditService.LogOperationAsync(
            SuperAdminAuditOperations.TenantDelete,
            "Tenant",
            tenantId,
            performedBy,
            GetCorrelationId(),
            beforeData,
            afterData,
            $"Deleted tenant: {reason}",
            severity: "Critical"
        );

        _logger.LogCritical("Deleted tenant {TenantId} - Reason: {Reason}", tenantId, reason);

        return true;
    }

    public async Task<Dictionary<string, object>> GetTenantUsageAsync(string tenantId)
    {
        try
        {
            // Get usage statistics from various tenant entities
            // Note: These queries use the tenant-filtered context but we need global access for superadmin

            // Temporarily disable global query filters for this operation
            using var tempContext = new PziDbContext(_dbContext.Database.GetDbConnection().ConnectionString);

            var userCount = await tempContext.Users.CountAsync(); // Would need to filter by tenant manually
            var speciesCount = await tempContext.Species.Where(s => s.TenantId == tenantId).CountAsync();
            var specimenCount = await tempContext.Specimens.Where(s => s.TenantId == tenantId).CountAsync();

            var tenant = await _dbContext.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
            var config = tenant?.GetConfiguration();
            var quotas = config?.Quotas ?? new TenantQuotas();

            return new Dictionary<string, object>
            {
                ["users"] = new { current = userCount, max = quotas.MaxUsers },
                ["species"] = new { current = speciesCount },
                ["specimens"] = new { current = specimenCount, max = quotas.MaxSpecimens },
                ["storage"] = new { current = 0, max = quotas.MaxStorageMB, unit = "MB" },
                ["lastUpdated"] = DateTime.UtcNow
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get usage statistics for tenant {TenantId}", tenantId);
            return new Dictionary<string, object>
            {
                ["error"] = "Failed to retrieve usage statistics"
            };
        }
    }

    public async Task<Dictionary<string, object>> GetTenantHealthAsync(string tenantId)
    {
        try
        {
            var tenant = await _dbContext.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);

            if (tenant == null)
            {
                return new Dictionary<string, object>
                {
                    ["status"] = "Not Found",
                    ["lastChecked"] = DateTime.UtcNow
                };
            }

            // Basic health checks
            var isActive = tenant.IsActive;
            var hasValidConfig = !string.IsNullOrEmpty(tenant.Configuration);
            var lastUpdate = tenant.UpdatedAt;
            var age = DateTime.UtcNow - tenant.CreatedAt;

            var status = isActive ? "Healthy" : "Suspended";
            if (!hasValidConfig)
                status = "Configuration Issues";

            return new Dictionary<string, object>
            {
                ["status"] = status,
                ["isActive"] = isActive,
                ["hasValidConfiguration"] = hasValidConfig,
                ["lastUpdated"] = lastUpdate,
                ["ageInDays"] = age.TotalDays,
                ["lastChecked"] = DateTime.UtcNow,
                ["checks"] = new Dictionary<string, object>
                {
                    ["tenantActive"] = isActive,
                    ["configurationValid"] = hasValidConfig,
                    ["recentActivity"] = (DateTime.UtcNow - lastUpdate).TotalDays < 30
                }
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get health status for tenant {TenantId}", tenantId);
            return new Dictionary<string, object>
            {
                ["status"] = "Error",
                ["error"] = "Failed to retrieve health status",
                ["lastChecked"] = DateTime.UtcNow
            };
        }
    }

    public async Task<(bool isValid, string[] errors)> ValidateTenantConfigurationAsync(
        TenantConfiguration? configuration,
        TenantFeatures? features)
    {
        var errors = new List<string>();

        if (configuration != null)
        {
            // Validate time zone
            if (!string.IsNullOrEmpty(configuration.TimeZone))
            {
                try
                {
                    TimeZoneInfo.FindSystemTimeZoneById(configuration.TimeZone);
                }
                catch
                {
                    errors.Add($"Invalid time zone: {configuration.TimeZone}");
                }
            }

            // Validate quotas
            if (configuration.Quotas.MaxUsers < 1)
                errors.Add("MaxUsers must be at least 1");

            if (configuration.Quotas.MaxSpecimens < 0)
                errors.Add("MaxSpecimens cannot be negative");

            if (configuration.Quotas.MaxStorageMB < 0)
                errors.Add("MaxStorageMB cannot be negative");
        }

        // Additional validation logic can be added here

        return (!errors.Any(), errors.ToArray());
    }

    private string GetCorrelationId()
    {
        var context = _httpContextAccessor.HttpContext;
        return context?.Items["SuperAdminCorrelationId"]?.ToString() ?? context?.TraceIdentifier ?? Guid.NewGuid().ToString();
    }
}