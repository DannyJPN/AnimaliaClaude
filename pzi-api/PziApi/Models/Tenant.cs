using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace PziApi.Models;

/// <summary>
/// Represents a tenant in the multi-tenant system
/// </summary>
public class Tenant
{
    public int Id { get; set; }

    [Required]
    [StringLength(255)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [StringLength(255)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string Subdomain { get; set; } = string.Empty;

    [StringLength(255)]
    public string? Auth0OrganizationId { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime ModifiedAt { get; set; }

    [StringLength(64)]
    public string? ModifiedBy { get; set; }

    // Configuration properties
    public string? Configuration { get; set; }
    public string? Theme { get; set; }
    public byte[]? Logo { get; set; }
    public string? ContactInfo { get; set; }

    // Limits and quotas
    public int MaxUsers { get; set; } = 100;
    public int MaxSpecimens { get; set; } = 10000;
    public int StorageQuotaMB { get; set; } = 1000;

    // Helper methods for JSON configuration
    public TenantConfiguration? GetConfiguration()
    {
        if (string.IsNullOrEmpty(Configuration))
            return null;

        try
        {
            return JsonSerializer.Deserialize<TenantConfiguration>(Configuration);
        }
        catch
        {
            return null;
        }
    }

    public void SetConfiguration(TenantConfiguration config)
    {
        Configuration = JsonSerializer.Serialize(config);
        ModifiedAt = DateTime.UtcNow;
    }

    public TenantTheme? GetTheme()
    {
        if (string.IsNullOrEmpty(Theme))
            return null;

        try
        {
            return JsonSerializer.Deserialize<TenantTheme>(Theme);
        }
        catch
        {
            return null;
        }
    }

    public void SetTheme(TenantTheme theme)
    {
        Theme = JsonSerializer.Serialize(theme);
        ModifiedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Tenant-specific configuration settings
/// </summary>
public class TenantConfiguration
{
    public string? TimeZone { get; set; } = "UTC";
    public string? DefaultLanguage { get; set; } = "en";
    public string? DateFormat { get; set; } = "yyyy-MM-dd";
    public string? Currency { get; set; } = "CZK";
    public bool EnableJournalWorkflow { get; set; } = true;
    public bool EnableSpecimenDocuments { get; set; } = true;
    public bool EnableContractManagement { get; set; } = true;
    public bool EnableImageUpload { get; set; } = true;
    public Dictionary<string, object>? CustomSettings { get; set; }
}

/// <summary>
/// Tenant-specific theme configuration
/// </summary>
public class TenantTheme
{
    public string? PrimaryColor { get; set; } = "#2E7D32";
    public string? SecondaryColor { get; set; } = "#1976D2";
    public string? BackgroundColor { get; set; } = "#FFFFFF";
    public string? TextColor { get; set; } = "#000000";
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public Dictionary<string, string>? CustomCss { get; set; }
}

/// <summary>
/// Base class for tenant-aware entities
/// </summary>
public abstract class TenantEntity
{
    public int TenantId { get; set; }
    public virtual Tenant? Tenant { get; set; }
}

/// <summary>
/// Interface for entities that support tenant isolation
/// </summary>
public interface ITenantEntity
{
    int TenantId { get; set; }
    Tenant? Tenant { get; set; }
}