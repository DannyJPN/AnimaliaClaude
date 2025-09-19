using Microsoft.AspNetCore.Mvc;
using PziApi.CrossCutting.Auth;
using PziApi.Services.SuperAdmin;
using PziApi.Models.SuperAdmin;
using PziApi.CrossCutting.Permissions;
using System.ComponentModel.DataAnnotations;

namespace PziApi.Controllers;

/// <summary>
/// SuperAdmin controller for centralized tenant and user management
/// </summary>
[ApiController]
[Route("api/superadmin")]
[RequireSuperAdmin]
public class SuperAdminController : ControllerBase
{
    private readonly ISuperAdminTenantService _tenantService;
    private readonly ISuperAdminUserService _userService;
    private readonly ISuperAdminSecurityService _securityService;
    private readonly ISuperAdminAuditService _auditService;
    private readonly ILogger<SuperAdminController> _logger;

    public SuperAdminController(
        ISuperAdminTenantService tenantService,
        ISuperAdminUserService userService,
        ISuperAdminSecurityService securityService,
        ISuperAdminAuditService auditService,
        ILogger<SuperAdminController> logger)
    {
        _tenantService = tenantService;
        _userService = userService;
        _securityService = securityService;
        _auditService = auditService;
        _logger = logger;
    }

    #region Tenant Management

    /// <summary>
    /// Gets all tenants with filtering and pagination
    /// </summary>
    [HttpGet("tenants")]
    [RequireTenantManagement]
    public async Task<ActionResult<PagedResponse<TenantDto>>> GetTenants(
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] DateTime? createdAfter = null,
        [FromQuery] DateTime? createdBefore = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var (tenants, totalCount) = await _tenantService.GetTenantsAsync(
                search, isActive, createdAfter, createdBefore, page, pageSize);

            var tenantDtos = tenants.Select(t => new TenantDto
            {
                Id = t.Id,
                Name = t.Name,
                DisplayName = t.DisplayName,
                Domain = t.Domain,
                IsActive = t.IsActive,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt,
                Configuration = t.GetConfiguration(),
                Theme = t.GetTheme(),
                Features = t.GetFeatures()
            }).ToList();

            return Ok(new PagedResponse<TenantDto>
            {
                Items = tenantDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve tenants");
            return StatusCode(500, "Failed to retrieve tenants");
        }
    }

    /// <summary>
    /// Gets detailed tenant information
    /// </summary>
    [HttpGet("tenants/{tenantId}")]
    [RequireTenantManagement]
    public async Task<ActionResult<TenantDetailDto>> GetTenant(string tenantId, [FromQuery] bool includeStats = false)
    {
        try
        {
            var tenant = await _tenantService.GetTenantDetailsAsync(tenantId, includeStats);
            if (tenant == null)
                return NotFound();

            var usage = includeStats ? await _tenantService.GetTenantUsageAsync(tenantId) : null;
            var health = includeStats ? await _tenantService.GetTenantHealthAsync(tenantId) : null;

            return Ok(new TenantDetailDto
            {
                Id = tenant.Id,
                Name = tenant.Name,
                DisplayName = tenant.DisplayName,
                Domain = tenant.Domain,
                IsActive = tenant.IsActive,
                CreatedAt = tenant.CreatedAt,
                UpdatedAt = tenant.UpdatedAt,
                Configuration = tenant.GetConfiguration(),
                Theme = tenant.GetTheme(),
                Features = tenant.GetFeatures(),
                Usage = usage,
                Health = health
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve tenant {TenantId}", tenantId);
            return StatusCode(500, "Failed to retrieve tenant");
        }
    }

    /// <summary>
    /// Creates a new tenant
    /// </summary>
    [HttpPost("tenants")]
    [RequireTenantCreate]
    public async Task<ActionResult<TenantDto>> CreateTenant([FromBody] CreateTenantRequest request)
    {
        try
        {
            var currentUser = GetCurrentUserId();
            var tenant = await _tenantService.CreateTenantAsync(
                request.Id,
                request.Name,
                request.DisplayName,
                request.Domain,
                request.Configuration,
                request.Theme,
                request.Features,
                currentUser
            );

            return CreatedAtAction(nameof(GetTenant), new { tenantId = tenant.Id }, new TenantDto
            {
                Id = tenant.Id,
                Name = tenant.Name,
                DisplayName = tenant.DisplayName,
                Domain = tenant.Domain,
                IsActive = tenant.IsActive,
                CreatedAt = tenant.CreatedAt,
                UpdatedAt = tenant.UpdatedAt,
                Configuration = tenant.GetConfiguration(),
                Theme = tenant.GetTheme(),
                Features = tenant.GetFeatures()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create tenant {TenantId}", request.Id);
            return StatusCode(500, "Failed to create tenant");
        }
    }

    /// <summary>
    /// Updates tenant information
    /// </summary>
    [HttpPut("tenants/{tenantId}")]
    [RequireTenantEdit]
    public async Task<ActionResult<TenantDto>> UpdateTenant(string tenantId, [FromBody] UpdateTenantRequest request)
    {
        try
        {
            var currentUser = GetCurrentUserId();
            var tenant = await _tenantService.UpdateTenantAsync(
                tenantId,
                request.DisplayName,
                request.Domain,
                request.IsActive,
                request.Configuration,
                request.Theme,
                request.Features,
                currentUser
            );

            if (tenant == null)
                return NotFound();

            return Ok(new TenantDto
            {
                Id = tenant.Id,
                Name = tenant.Name,
                DisplayName = tenant.DisplayName,
                Domain = tenant.Domain,
                IsActive = tenant.IsActive,
                CreatedAt = tenant.CreatedAt,
                UpdatedAt = tenant.UpdatedAt,
                Configuration = tenant.GetConfiguration(),
                Theme = tenant.GetTheme(),
                Features = tenant.GetFeatures()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update tenant {TenantId}", tenantId);
            return StatusCode(500, "Failed to update tenant");
        }
    }

    /// <summary>
    /// Suspends a tenant
    /// </summary>
    [HttpPost("tenants/{tenantId}/suspend")]
    [RequireTenantEdit]
    public async Task<ActionResult> SuspendTenant(string tenantId, [FromBody] SuspendTenantRequest request)
    {
        try
        {
            var currentUser = GetCurrentUserId();
            var success = await _tenantService.SuspendTenantAsync(tenantId, request.Reason, currentUser!);

            if (!success)
                return NotFound();

            return Ok(new { message = "Tenant suspended successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to suspend tenant {TenantId}", tenantId);
            return StatusCode(500, "Failed to suspend tenant");
        }
    }

    /// <summary>
    /// Restores a suspended tenant
    /// </summary>
    [HttpPost("tenants/{tenantId}/restore")]
    [RequireTenantEdit]
    public async Task<ActionResult> RestoreTenant(string tenantId)
    {
        try
        {
            var currentUser = GetCurrentUserId();
            var success = await _tenantService.RestoreTenantAsync(tenantId, currentUser!);

            if (!success)
                return NotFound();

            return Ok(new { message = "Tenant restored successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to restore tenant {TenantId}", tenantId);
            return StatusCode(500, "Failed to restore tenant");
        }
    }

    #endregion

    #region User Management

    /// <summary>
    /// Gets users across all tenants
    /// </summary>
    [HttpGet("users")]
    [RequireUserManagement]
    public async Task<ActionResult<PagedResponse<UserDto>>> GetUsers(
        [FromQuery] string? tenantId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null,
        [FromQuery] DateTime? createdAfter = null,
        [FromQuery] DateTime? lastActiveAfter = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var (users, totalCount) = await _userService.GetUsersAsync(
                tenantId, search, role, createdAfter, lastActiveAfter, page, pageSize);

            var userDtos = users.Select(u => new UserDto
            {
                Id = u.Id,
                UserName = u.UserName,
                // Add other user properties as needed
            }).ToList();

            return Ok(new PagedResponse<UserDto>
            {
                Items = userDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve users");
            return StatusCode(500, "Failed to retrieve users");
        }
    }

    /// <summary>
    /// Starts impersonation session
    /// </summary>
    [HttpPost("impersonate")]
    [RequireUserImpersonation]
    public async Task<ActionResult<ImpersonationResponse>> StartImpersonation([FromBody] StartImpersonationRequest request)
    {
        try
        {
            var currentUser = GetCurrentUserId();
            var sessionToken = await _securityService.StartImpersonationAsync(
                currentUser!, request.TenantId, request.TargetUserId, request.DurationMinutes ?? 30);

            if (string.IsNullOrEmpty(sessionToken))
                return BadRequest("Failed to start impersonation session");

            return Ok(new ImpersonationResponse
            {
                SessionToken = sessionToken,
                TenantId = request.TenantId,
                TargetUserId = request.TargetUserId,
                ExpiresAt = DateTime.UtcNow.AddMinutes(request.DurationMinutes ?? 30)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start impersonation");
            return StatusCode(500, "Failed to start impersonation");
        }
    }

    /// <summary>
    /// Ends impersonation session
    /// </summary>
    [HttpPost("impersonate/end")]
    [RequireUserImpersonation]
    public async Task<ActionResult> EndImpersonation([FromBody] EndImpersonationRequest request)
    {
        try
        {
            var success = await _securityService.EndImpersonationAsync(request.SessionToken);
            if (!success)
                return BadRequest("Failed to end impersonation session");

            return Ok(new { message = "Impersonation session ended successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to end impersonation");
            return StatusCode(500, "Failed to end impersonation");
        }
    }

    #endregion

    #region Audit and Security

    /// <summary>
    /// Gets audit logs with filtering
    /// </summary>
    [HttpGet("audit")]
    [RequireAuditAccess]
    public async Task<ActionResult<PagedResponse<AuditLogDto>>> GetAuditLogs(
        [FromQuery] string? operation = null,
        [FromQuery] string? entityType = null,
        [FromQuery] string? performedBy = null,
        [FromQuery] string? tenantId = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string? severity = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var (logs, totalCount) = await _auditService.GetAuditLogsAsync(
                operation, entityType, performedBy, tenantId, fromDate, toDate, severity, page, pageSize);

            var logDtos = logs.Select(l => new AuditLogDto
            {
                Id = l.Id,
                Operation = l.Operation,
                EntityType = l.EntityType,
                EntityId = l.EntityId,
                PerformedBy = l.PerformedBy,
                Timestamp = l.Timestamp,
                IpAddress = l.IpAddress,
                TenantId = l.TenantId,
                ImpersonatedTenantId = l.ImpersonatedTenantId,
                Severity = l.Severity,
                AdditionalContext = l.AdditionalContext
            }).ToList();

            return Ok(new PagedResponse<AuditLogDto>
            {
                Items = logDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve audit logs");
            return StatusCode(500, "Failed to retrieve audit logs");
        }
    }

    /// <summary>
    /// Gets audit statistics for dashboard
    /// </summary>
    [HttpGet("audit/statistics")]
    [RequireAuditAccess]
    public async Task<ActionResult<Dictionary<string, object>>> GetAuditStatistics(
        [FromQuery] DateTime fromDate,
        [FromQuery] DateTime toDate,
        [FromQuery] string? tenantId = null)
    {
        try
        {
            var statistics = await _auditService.GetAuditStatisticsAsync(fromDate, toDate, tenantId);
            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve audit statistics");
            return StatusCode(500, "Failed to retrieve audit statistics");
        }
    }

    #endregion

    #region Health and Monitoring

    /// <summary>
    /// Gets system health status
    /// </summary>
    [HttpGet("health")]
    [RequireSystemManagement]
    public async Task<ActionResult<HealthStatusResponse>> GetSystemHealth()
    {
        try
        {
            // TODO: Implement comprehensive health checks
            var healthStatus = new HealthStatusResponse
            {
                Status = "Healthy",
                Timestamp = DateTime.UtcNow,
                Services = new Dictionary<string, string>
                {
                    ["database"] = "Healthy",
                    ["auth"] = "Healthy",
                    ["api"] = "Healthy"
                }
            };

            return Ok(healthStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to retrieve system health");
            return StatusCode(500, "Failed to retrieve system health");
        }
    }

    #endregion

    private string? GetCurrentUserId()
    {
        return User?.FindFirst("sub")?.Value ?? User?.FindFirst("user_id")?.Value;
    }
}

// DTOs for API requests and responses
public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class TenantDto
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string DisplayName { get; set; }
    public string? Domain { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Models.TenantConfiguration Configuration { get; set; } = new();
    public Models.TenantTheme Theme { get; set; } = new();
    public Models.TenantFeatures Features { get; set; } = new();
}

public class TenantDetailDto : TenantDto
{
    public Dictionary<string, object>? Usage { get; set; }
    public Dictionary<string, object>? Health { get; set; }
}

public class CreateTenantRequest
{
    [Required]
    [MaxLength(50)]
    public required string Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(200)]
    public required string DisplayName { get; set; }

    [MaxLength(100)]
    public string? Domain { get; set; }

    public Models.TenantConfiguration? Configuration { get; set; }
    public Models.TenantTheme? Theme { get; set; }
    public Models.TenantFeatures? Features { get; set; }
}

public class UpdateTenantRequest
{
    [MaxLength(200)]
    public string? DisplayName { get; set; }

    [MaxLength(100)]
    public string? Domain { get; set; }

    public bool? IsActive { get; set; }
    public Models.TenantConfiguration? Configuration { get; set; }
    public Models.TenantTheme? Theme { get; set; }
    public Models.TenantFeatures? Features { get; set; }
}

public class SuspendTenantRequest
{
    [Required]
    [MaxLength(500)]
    public required string Reason { get; set; }
}

public class UserDto
{
    public int Id { get; set; }
    public required string UserName { get; set; }
    // Add other user properties as needed
}

public class StartImpersonationRequest
{
    [Required]
    public required string TenantId { get; set; }

    public string? TargetUserId { get; set; }

    [Range(5, 480)] // 5 minutes to 8 hours
    public int? DurationMinutes { get; set; } = 30;
}

public class EndImpersonationRequest
{
    [Required]
    public required string SessionToken { get; set; }
}

public class ImpersonationResponse
{
    public required string SessionToken { get; set; }
    public required string TenantId { get; set; }
    public string? TargetUserId { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class AuditLogDto
{
    public long Id { get; set; }
    public required string Operation { get; set; }
    public required string EntityType { get; set; }
    public string? EntityId { get; set; }
    public required string PerformedBy { get; set; }
    public DateTime Timestamp { get; set; }
    public required string IpAddress { get; set; }
    public string? TenantId { get; set; }
    public string? ImpersonatedTenantId { get; set; }
    public required string Severity { get; set; }
    public string? AdditionalContext { get; set; }
}

public class HealthStatusResponse
{
    public required string Status { get; set; }
    public DateTime Timestamp { get; set; }
    public Dictionary<string, string> Services { get; set; } = new();
}