using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace PziApi.Models.SuperAdmin;

/// <summary>
/// Audit log entry for superadmin operations - tamper-resistant logging
/// </summary>
public class SuperAdminAuditLog
{
    public long Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Operation { get; set; }

    [Required]
    [MaxLength(100)]
    public required string EntityType { get; set; }

    [MaxLength(100)]
    public string? EntityId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string PerformedBy { get; set; }

    [Required]
    [MaxLength(200)]
    public required string UserAgent { get; set; }

    [Required]
    [MaxLength(50)]
    public required string IpAddress { get; set; }

    [Required]
    [MaxLength(100)]
    public required string CorrelationId { get; set; }

    [MaxLength(50)]
    public string? TenantId { get; set; }

    [MaxLength(50)]
    public string? ImpersonatedTenantId { get; set; }

    public string? BeforeData { get; set; }
    public string? AfterData { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(500)]
    public string? AdditionalContext { get; set; }

    [MaxLength(20)]
    public required string Severity { get; set; } = "Info"; // Info, Warning, Critical

    // Computed hash for tamper detection
    [MaxLength(100)]
    public string? IntegrityHash { get; set; }
}

/// <summary>
/// Superadmin user with global permissions
/// </summary>
public class SuperAdminUser
{
    [Key]
    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Email { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Name { get; set; }

    public bool IsActive { get; set; } = true;

    [Required]
    [MaxLength(50)]
    public required string Role { get; set; } // SuperAdmin, TenantAdmin

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    [MaxLength(100)]
    public string? LastModifiedBy { get; set; }

    // For tenant-scoped admins (optional)
    [MaxLength(50)]
    public string? ScopedToTenantId { get; set; }

    [MaxLength(1000)]
    public string? Permissions { get; set; }

    // Last activity tracking
    public DateTime? LastLoginAt { get; set; }
    [MaxLength(50)]
    public string? LastLoginIp { get; set; }

    // Account lockout
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockedUntil { get; set; }

    public Tenant? ScopedToTenant { get; set; }
    public ICollection<SuperAdminSession>? Sessions { get; set; }

    public string[] GetPermissions()
    {
        if (string.IsNullOrEmpty(Permissions))
            return Array.Empty<string>();

        return JsonSerializer.Deserialize<string[]>(Permissions) ?? Array.Empty<string>();
    }

    public void SetPermissions(string[] permissions)
    {
        Permissions = JsonSerializer.Serialize(permissions);
        UpdatedAt = DateTime.UtcNow;
    }
}

/// <summary>
/// Active superadmin session for tracking and security
/// </summary>
public class SuperAdminSession
{
    public long Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string UserId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string SessionToken { get; set; }

    [MaxLength(50)]
    public string? ImpersonatedTenantId { get; set; }

    [MaxLength(100)]
    public string? ImpersonatedUserId { get; set; }

    [Required]
    [MaxLength(50)]
    public required string IpAddress { get; set; }

    [Required]
    [MaxLength(200)]
    public required string UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public DateTime? TerminatedAt { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Active"; // Active, Expired, Terminated

    public bool IsActive => Status == "Active" && DateTime.UtcNow < ExpiresAt && TerminatedAt == null;

    public SuperAdminUser? User { get; set; }
    public Tenant? ImpersonatedTenant { get; set; }
}

/// <summary>
/// Notification configuration for superadmin events
/// </summary>
public class SuperAdminNotificationConfig
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public required string EventType { get; set; }

    [MaxLength(50)]
    public string? TenantId { get; set; } // null for global events

    [Required]
    [MaxLength(20)]
    public required string Channel { get; set; } // Webhook, Email, Queue

    [Required]
    public required string Configuration { get; set; } // JSON config specific to channel

    public bool IsActive { get; set; } = true;

    [MaxLength(20)]
    public string Priority { get; set; } = "Normal"; // Low, Normal, High, Critical

    [MaxLength(500)]
    public string? Filter { get; set; } // JSON filter conditions

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Tenant? Tenant { get; set; }
}

/// <summary>
/// Webhook delivery tracking
/// </summary>
public class SuperAdminWebhookDelivery
{
    public long Id { get; set; }

    public int ConfigId { get; set; }

    [Required]
    [MaxLength(50)]
    public required string EventType { get; set; }

    [Required]
    [MaxLength(100)]
    public required string EventId { get; set; } // Correlation ID

    [Required]
    public required string Payload { get; set; }

    [Required]
    [MaxLength(500)]
    public required string TargetUrl { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Pending"; // Pending, Delivered, Failed, Abandoned

    public int AttemptCount { get; set; } = 0;
    public int MaxAttempts { get; set; } = 5;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DeliveredAt { get; set; }
    public DateTime? NextRetryAt { get; set; }

    [MaxLength(100)]
    public string? LastErrorMessage { get; set; }
    public int? LastHttpStatusCode { get; set; }

    [MaxLength(100)]
    public string? IdempotencyKey { get; set; }

    [MaxLength(200)]
    public string? Signature { get; set; } // HMAC signature

    public SuperAdminNotificationConfig? Config { get; set; }
}

/// <summary>
/// Feature flags for superadmin operations
/// </summary>
public class SuperAdminFeatureFlag
{
    [Key]
    [Required]
    [MaxLength(100)]
    public required string Key { get; set; }

    [Required]
    [MaxLength(200)]
    public required string Name { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public bool IsEnabled { get; set; } = false;

    [MaxLength(50)]
    public string? TenantId { get; set; } // null for global flags

    [MaxLength(1000)]
    public string? Configuration { get; set; } // JSON configuration

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? CreatedBy { get; set; }

    public Tenant? Tenant { get; set; }
}

/// <summary>
/// System health metrics for monitoring
/// </summary>
public class SuperAdminHealthMetric
{
    public long Id { get; set; }

    [Required]
    [MaxLength(100)]
    public required string MetricName { get; set; }

    public decimal Value { get; set; }

    [MaxLength(20)]
    public required string Unit { get; set; }

    [MaxLength(50)]
    public string? TenantId { get; set; }

    [MaxLength(100)]
    public string? Source { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(200)]
    public string? Tags { get; set; } // JSON tags for filtering
}

/// <summary>
/// Data export job tracking
/// </summary>
public class SuperAdminDataExport
{
    public long Id { get; set; }

    [Required]
    [MaxLength(50)]
    public required string ExportType { get; set; } // TenantData, Users, AuditLogs, etc.

    [MaxLength(50)]
    public string? TenantId { get; set; }

    [Required]
    [MaxLength(100)]
    public required string RequestedBy { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Pending"; // Pending, Processing, Completed, Failed

    [MaxLength(20)]
    public required string Format { get; set; } // CSV, JSON, Excel

    [MaxLength(1000)]
    public string? Parameters { get; set; } // JSON export parameters

    [MaxLength(500)]
    public string? FilePath { get; set; }
    public long? FileSizeBytes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    [MaxLength(500)]
    public string? ErrorMessage { get; set; }

    public int ProgressPercentage { get; set; } = 0;

    public SuperAdminUser? RequestedByUser { get; set; }
    public Tenant? Tenant { get; set; }
}