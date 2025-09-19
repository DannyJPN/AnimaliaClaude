using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Auth;
using PziApi.Models;
using System.Security.Claims;

namespace PziApi.Tenants;

[ApiController]
[Route("api/tenants")]
[Auth0Authorize] // Require authentication
public class TenantController : ControllerBase
{
    private readonly PziDbContext _dbContext;
    private readonly ILogger<TenantController> _logger;

    public TenantController(PziDbContext dbContext, ILogger<TenantController> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Get all tenants (admin only)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<TenantDto>>> GetTenants()
    {
        // Only allow admins to see all tenants
        if (!User.IsInRole("admin"))
        {
            return Forbid();
        }

        var tenants = await _dbContext.Tenants
            .Select(t => new TenantDto
            {
                Id = t.Id,
                Name = t.Name,
                DisplayName = t.DisplayName,
                Subdomain = t.Subdomain,
                IsActive = t.IsActive,
                CreatedAt = t.CreatedAt,
                MaxUsers = t.MaxUsers,
                MaxSpecimens = t.MaxSpecimens,
                StorageQuotaMB = t.StorageQuotaMB
            })
            .ToListAsync();

        return Ok(tenants);
    }

    /// <summary>
    /// Get current user's tenant information
    /// </summary>
    [HttpGet("current")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TenantDto>> GetCurrentTenant()
    {
        var tenantClaim = User.FindFirst("tenant")?.Value;
        if (string.IsNullOrEmpty(tenantClaim))
        {
            return NotFound("No tenant information found");
        }

        var tenant = await _dbContext.Tenants
            .Where(t => t.Name == tenantClaim && t.IsActive)
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound($"Tenant '{tenantClaim}' not found");
        }

        var dto = new TenantDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            DisplayName = tenant.DisplayName,
            Subdomain = tenant.Subdomain,
            IsActive = tenant.IsActive,
            CreatedAt = tenant.CreatedAt,
            MaxUsers = tenant.MaxUsers,
            MaxSpecimens = tenant.MaxSpecimens,
            StorageQuotaMB = tenant.StorageQuotaMB,
            Configuration = tenant.GetConfiguration(),
            Theme = tenant.GetTheme()
        };

        return Ok(dto);
    }

    /// <summary>
    /// Create a new tenant (admin only)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TenantDto>> CreateTenant(CreateTenantRequest request)
    {
        if (!User.IsInRole("admin"))
        {
            return Forbid();
        }

        // Validate request
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.DisplayName) ||
            string.IsNullOrWhiteSpace(request.Subdomain))
        {
            return BadRequest("Name, DisplayName, and Subdomain are required");
        }

        // Check if tenant already exists
        var existingTenant = await _dbContext.Tenants
            .Where(t => t.Name == request.Name || t.Subdomain == request.Subdomain)
            .FirstOrDefaultAsync();

        if (existingTenant != null)
        {
            return Conflict("Tenant with this name or subdomain already exists");
        }

        var tenant = new Models.Tenant
        {
            Name = request.Name,
            DisplayName = request.DisplayName,
            Subdomain = request.Subdomain.ToLowerInvariant(),
            Auth0OrganizationId = request.Auth0OrganizationId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            ModifiedAt = DateTime.UtcNow,
            ModifiedBy = User.Identity?.Name ?? "admin",
            MaxUsers = request.MaxUsers ?? 100,
            MaxSpecimens = request.MaxSpecimens ?? 10000,
            StorageQuotaMB = request.StorageQuotaMB ?? 1000
        };

        if (request.Configuration != null)
        {
            tenant.SetConfiguration(request.Configuration);
        }

        if (request.Theme != null)
        {
            tenant.SetTheme(request.Theme);
        }

        _dbContext.Tenants.Add(tenant);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Created new tenant {TenantName} with ID {TenantId} by user {User}",
            tenant.Name, tenant.Id, User.Identity?.Name);

        var dto = new TenantDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            DisplayName = tenant.DisplayName,
            Subdomain = tenant.Subdomain,
            IsActive = tenant.IsActive,
            CreatedAt = tenant.CreatedAt,
            MaxUsers = tenant.MaxUsers,
            MaxSpecimens = tenant.MaxSpecimens,
            StorageQuotaMB = tenant.StorageQuotaMB,
            Configuration = tenant.GetConfiguration(),
            Theme = tenant.GetTheme()
        };

        return CreatedAtAction(nameof(GetCurrentTenant), dto);
    }

    /// <summary>
    /// Update tenant configuration (tenant admin only)
    /// </summary>
    [HttpPut("current/config")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TenantDto>> UpdateTenantConfig(UpdateTenantConfigRequest request)
    {
        var tenantClaim = User.FindFirst("tenant")?.Value;
        if (string.IsNullOrEmpty(tenantClaim))
        {
            return NotFound("No tenant information found");
        }

        // Only allow admins and curators to update config
        if (!User.IsInRole("admin") && !User.IsInRole("curator"))
        {
            return Forbid();
        }

        var tenant = await _dbContext.Tenants
            .Where(t => t.Name == tenantClaim && t.IsActive)
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound($"Tenant '{tenantClaim}' not found");
        }

        if (request.Configuration != null)
        {
            tenant.SetConfiguration(request.Configuration);
        }

        if (request.Theme != null)
        {
            tenant.SetTheme(request.Theme);
        }

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            tenant.DisplayName = request.DisplayName;
        }

        tenant.ModifiedAt = DateTime.UtcNow;
        tenant.ModifiedBy = User.Identity?.Name ?? "unknown";

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Updated tenant configuration for {TenantName} by user {User}",
            tenant.Name, User.Identity?.Name);

        var dto = new TenantDto
        {
            Id = tenant.Id,
            Name = tenant.Name,
            DisplayName = tenant.DisplayName,
            Subdomain = tenant.Subdomain,
            IsActive = tenant.IsActive,
            CreatedAt = tenant.CreatedAt,
            MaxUsers = tenant.MaxUsers,
            MaxSpecimens = tenant.MaxSpecimens,
            StorageQuotaMB = tenant.StorageQuotaMB,
            Configuration = tenant.GetConfiguration(),
            Theme = tenant.GetTheme()
        };

        return Ok(dto);
    }
}

// DTOs
public class TenantDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public int MaxUsers { get; set; }
    public int MaxSpecimens { get; set; }
    public int StorageQuotaMB { get; set; }
    public TenantConfiguration? Configuration { get; set; }
    public TenantTheme? Theme { get; set; }
}

public class CreateTenantRequest
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Subdomain { get; set; } = string.Empty;
    public string? Auth0OrganizationId { get; set; }
    public int? MaxUsers { get; set; }
    public int? MaxSpecimens { get; set; }
    public int? StorageQuotaMB { get; set; }
    public TenantConfiguration? Configuration { get; set; }
    public TenantTheme? Theme { get; set; }
}

public class UpdateTenantConfigRequest
{
    public string? DisplayName { get; set; }
    public TenantConfiguration? Configuration { get; set; }
    public TenantTheme? Theme { get; set; }
}