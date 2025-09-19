using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace PziApi.Models;

public class Tenant
{
    [Key]
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

    [MaxLength(500)]
    public string? ConnectionString { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // JSON configuration fields
    [MaxLength(4000)]
    public string? Configuration { get; set; }

    [MaxLength(4000)]
    public string? Theme { get; set; }

    [MaxLength(4000)]
    public string? Features { get; set; }

    // Strongly typed configuration properties
    public TenantConfiguration GetConfiguration()
    {
        if (string.IsNullOrEmpty(Configuration))
            return new TenantConfiguration();

        return JsonSerializer.Deserialize<TenantConfiguration>(Configuration) ?? new TenantConfiguration();
    }

    public void SetConfiguration(TenantConfiguration configuration)
    {
        Configuration = JsonSerializer.Serialize(configuration);
        UpdatedAt = DateTime.UtcNow;
    }

    public TenantTheme GetTheme()
    {
        if (string.IsNullOrEmpty(Theme))
            return new TenantTheme();

        return JsonSerializer.Deserialize<TenantTheme>(Theme) ?? new TenantTheme();
    }

    public void SetTheme(TenantTheme theme)
    {
        Theme = JsonSerializer.Serialize(theme);
        UpdatedAt = DateTime.UtcNow;
    }

    public TenantFeatures GetFeatures()
    {
        if (string.IsNullOrEmpty(Features))
            return new TenantFeatures();

        return JsonSerializer.Deserialize<TenantFeatures>(Features) ?? new TenantFeatures();
    }

    public void SetFeatures(TenantFeatures features)
    {
        Features = JsonSerializer.Serialize(features);
        UpdatedAt = DateTime.UtcNow;
    }
}

public class TenantConfiguration
{
    public string TimeZone { get; set; } = "Europe/Prague";
    public string Language { get; set; } = "cs-CZ";
    public string Currency { get; set; } = "CZK";
    public string DateFormat { get; set; } = "dd.MM.yyyy";
    public TenantQuotas Quotas { get; set; } = new();
}

public class TenantQuotas
{
    public int MaxUsers { get; set; } = 10;
    public int MaxSpecimens { get; set; } = 1000;
    public int MaxStorageMB { get; set; } = 500;
}

public class TenantTheme
{
    public string PrimaryColor { get; set; } = "#6200EA";
    public string SecondaryColor { get; set; } = "#7C4DFF";
    public string? LogoUrl { get; set; }
    public string? BackgroundImage { get; set; }
}

public class TenantFeatures
{
    public bool JournalWorkflow { get; set; } = true;
    public bool DocumentManagement { get; set; } = false;
    public bool CadaverTracking { get; set; } = false;
    public bool ContractManagement { get; set; } = false;
    public bool MovementTracking { get; set; } = true;
}

// Base entity class for tenant-aware entities
public abstract class TenantEntity
{
    [Required]
    [MaxLength(50)]
    public required string TenantId { get; set; }

    public Tenant? Tenant { get; set; }
}