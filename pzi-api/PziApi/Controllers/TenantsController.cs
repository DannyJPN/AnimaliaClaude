using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Tenant;
using PziApi.CrossCutting.Auth;
using PziApi.Models;

namespace PziApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TenantsController : ControllerBase
{
    private readonly PziDbContext _dbContext;
    private readonly ITenantContext _tenantContext;
    private readonly ILogger<TenantsController> _logger;

    public TenantsController(PziDbContext dbContext, ITenantContext tenantContext, ILogger<TenantsController> logger)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
        _logger = logger;
    }

    [HttpGet]
    [RequireAdminRole]
    public async Task<ActionResult<IEnumerable<Models.Tenant>>> GetTenants()
    {
        // Only allow admin users to view all tenants
        var tenants = await _dbContext.Tenants
            .Where(t => t.IsActive)
            .OrderBy(t => t.DisplayName)
            .ToListAsync();

        return Ok(tenants);
    }

    [HttpGet("{id}")]
    [RequireAdminRole]
    public async Task<ActionResult<Models.Tenant>> GetTenant(string id)
    {
        // Only allow admin users to view specific tenant details
        var tenant = await _dbContext.Tenants
            .Where(t => t.Id == id && t.IsActive)
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound();
        }

        return Ok(tenant);
    }

    [HttpGet("current")]
    public async Task<ActionResult<Models.Tenant>> GetCurrentTenant()
    {
        var currentTenantId = _tenantContext.CurrentTenantId;
        if (string.IsNullOrEmpty(currentTenantId))
        {
            return BadRequest("No tenant context available");
        }

        var tenant = await _dbContext.Tenants
            .Where(t => t.Id == currentTenantId && t.IsActive)
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound();
        }

        return Ok(tenant);
    }

    [HttpPut("current/configuration")]
    public async Task<ActionResult<Models.Tenant>> UpdateCurrentTenantConfiguration([FromBody] TenantConfigurationRequest request)
    {
        var currentTenantId = _tenantContext.CurrentTenantId;
        if (string.IsNullOrEmpty(currentTenantId))
        {
            return BadRequest("No tenant context available");
        }

        var tenant = await _dbContext.Tenants
            .Where(t => t.Id == currentTenantId && t.IsActive)
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound();
        }

        // Update configuration
        if (request.Configuration != null)
        {
            tenant.SetConfiguration(request.Configuration);
        }

        if (request.Theme != null)
        {
            tenant.SetTheme(request.Theme);
        }

        if (request.Features != null)
        {
            tenant.SetFeatures(request.Features);
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Tenant {TenantId} configuration updated", currentTenantId);

        return Ok(tenant);
    }

    [HttpPost]
    [RequireAdminRole]
    public async Task<ActionResult<Models.Tenant>> CreateTenant([FromBody] CreateTenantRequest request)
    {
        // Validate input
        if (string.IsNullOrEmpty(request.Id) || string.IsNullOrEmpty(request.Name) || string.IsNullOrEmpty(request.DisplayName))
        {
            return BadRequest("Id, Name, and DisplayName are required");
        }

        // Check if tenant already exists
        var existingTenant = await _dbContext.Tenants
            .Where(t => t.Id == request.Id)
            .FirstOrDefaultAsync();

        if (existingTenant != null)
        {
            return Conflict($"Tenant with ID '{request.Id}' already exists");
        }

        var newTenant = new Models.Tenant
        {
            Id = request.Id,
            Name = request.Name,
            DisplayName = request.DisplayName,
            Domain = request.Domain,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        if (request.Configuration != null)
        {
            newTenant.SetConfiguration(request.Configuration);
        }

        if (request.Theme != null)
        {
            newTenant.SetTheme(request.Theme);
        }

        if (request.Features != null)
        {
            newTenant.SetFeatures(request.Features);
        }

        _dbContext.Tenants.Add(newTenant);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("New tenant created: {TenantId}", request.Id);

        return CreatedAtAction(nameof(GetTenant), new { id = newTenant.Id }, newTenant);
    }

    [HttpPut("{id}")]
    [RequireAdminRole]
    public async Task<ActionResult<Models.Tenant>> UpdateTenant(string id, [FromBody] UpdateTenantRequest request)
    {
        var tenant = await _dbContext.Tenants
            .Where(t => t.Id == id)
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound();
        }

        // Update properties
        if (!string.IsNullOrEmpty(request.DisplayName))
            tenant.DisplayName = request.DisplayName;

        if (request.Domain != null)
            tenant.Domain = request.Domain;

        if (request.IsActive.HasValue)
            tenant.IsActive = request.IsActive.Value;

        tenant.UpdatedAt = DateTime.UtcNow;

        if (request.Configuration != null)
        {
            tenant.SetConfiguration(request.Configuration);
        }

        if (request.Theme != null)
        {
            tenant.SetTheme(request.Theme);
        }

        if (request.Features != null)
        {
            tenant.SetFeatures(request.Features);
        }

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Tenant {TenantId} updated", id);

        return Ok(tenant);
    }

    [HttpDelete("{id}")]
    [RequireAdminRole]
    public async Task<ActionResult> DeleteTenant(string id)
    {
        var tenant = await _dbContext.Tenants
            .Where(t => t.Id == id)
            .FirstOrDefaultAsync();

        if (tenant == null)
        {
            return NotFound();
        }

        // Soft delete by setting IsActive to false
        tenant.IsActive = false;
        tenant.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Tenant {TenantId} deactivated", id);

        return NoContent();
    }
}

// DTOs for API requests
public class CreateTenantRequest
{
    public required string Id { get; set; }
    public required string Name { get; set; }
    public required string DisplayName { get; set; }
    public string? Domain { get; set; }
    public TenantConfiguration? Configuration { get; set; }
    public TenantTheme? Theme { get; set; }
    public TenantFeatures? Features { get; set; }
}

public class UpdateTenantRequest
{
    public string? DisplayName { get; set; }
    public string? Domain { get; set; }
    public bool? IsActive { get; set; }
    public TenantConfiguration? Configuration { get; set; }
    public TenantTheme? Theme { get; set; }
    public TenantFeatures? Features { get; set; }
}

public class TenantConfigurationRequest
{
    public TenantConfiguration? Configuration { get; set; }
    public TenantTheme? Theme { get; set; }
    public TenantFeatures? Features { get; set; }
}