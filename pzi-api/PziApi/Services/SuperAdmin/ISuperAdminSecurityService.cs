namespace PziApi.Services.SuperAdmin;

/// <summary>
/// Service for handling superadmin security operations including authentication and authorization
/// </summary>
public interface ISuperAdminSecurityService
{
    /// <summary>
    /// Checks if a user has superadmin privileges
    /// </summary>
    Task<bool> IsSuperAdminAsync(string userId);

    /// <summary>
    /// Checks if a superadmin user has specific permissions
    /// </summary>
    Task<bool> HasPermissionsAsync(string userId, string[] permissions, bool requireAll = true);

    /// <summary>
    /// Gets all permissions for a superadmin user
    /// </summary>
    Task<string[]> GetUserPermissionsAsync(string userId);

    /// <summary>
    /// Creates or updates a superadmin user
    /// </summary>
    Task<bool> CreateOrUpdateSuperAdminAsync(string userId, string email, string name, string role, string[]? permissions = null, string? scopedToTenantId = null);

    /// <summary>
    /// Deactivates a superadmin user
    /// </summary>
    Task<bool> DeactivateSuperAdminAsync(string userId, string performedBy);

    /// <summary>
    /// Starts an impersonation session for a superadmin
    /// </summary>
    Task<string?> StartImpersonationAsync(string superAdminUserId, string tenantId, string? targetUserId = null, int sessionDurationMinutes = 30);

    /// <summary>
    /// Ends an impersonation session
    /// </summary>
    Task<bool> EndImpersonationAsync(string sessionToken);

    /// <summary>
    /// Gets current impersonation context if any
    /// </summary>
    Task<(string? TenantId, string? UserId)> GetImpersonationContextAsync(string sessionToken);

    /// <summary>
    /// Validates and refreshes a superadmin session
    /// </summary>
    Task<bool> ValidateSessionAsync(string userId, string sessionToken);

    /// <summary>
    /// Terminates all sessions for a user (security lockout)
    /// </summary>
    Task TerminateAllSessionsAsync(string userId, string reason);

    /// <summary>
    /// Gets active sessions for a user
    /// </summary>
    Task<IEnumerable<Models.SuperAdmin.SuperAdminSession>> GetActiveSessionsAsync(string userId);

    /// <summary>
    /// Records a failed login attempt and handles lockout logic
    /// </summary>
    Task HandleFailedLoginAsync(string userId, string ipAddress);

    /// <summary>
    /// Records a successful login and resets failed attempts
    /// </summary>
    Task HandleSuccessfulLoginAsync(string userId, string ipAddress, string userAgent, string sessionToken);

    /// <summary>
    /// Checks if a user is currently locked out
    /// </summary>
    Task<bool> IsUserLockedOutAsync(string userId);
}

/// <summary>
/// Service for superadmin audit logging
/// </summary>
public interface ISuperAdminAuditService
{
    /// <summary>
    /// Logs a superadmin operation for audit purposes
    /// </summary>
    Task LogOperationAsync(
        string operation,
        string entityType,
        string? entityId,
        string performedBy,
        string correlationId,
        object? beforeData = null,
        object? afterData = null,
        string? context = null,
        string severity = "Info",
        string? tenantId = null,
        string? impersonatedTenantId = null
    );

    /// <summary>
    /// Gets audit logs with filtering and pagination
    /// </summary>
    Task<(IEnumerable<Models.SuperAdmin.SuperAdminAuditLog> logs, int totalCount)> GetAuditLogsAsync(
        string? operation = null,
        string? entityType = null,
        string? performedBy = null,
        string? tenantId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? severity = null,
        int page = 1,
        int pageSize = 50
    );

    /// <summary>
    /// Exports audit logs for compliance or investigation
    /// </summary>
    Task<string> ExportAuditLogsAsync(
        string format, // CSV, JSON, Excel
        string? operation = null,
        string? entityType = null,
        string? performedBy = null,
        string? tenantId = null,
        DateTime? fromDate = null,
        DateTime? toDate = null,
        string? severity = null
    );

    /// <summary>
    /// Validates audit log integrity (tamper detection)
    /// </summary>
    Task<bool> ValidateAuditIntegrityAsync(long logId);

    /// <summary>
    /// Gets audit statistics for dashboard
    /// </summary>
    Task<Dictionary<string, object>> GetAuditStatisticsAsync(
        DateTime fromDate,
        DateTime toDate,
        string? tenantId = null
    );
}

/// <summary>
/// Service for tenant management operations
/// </summary>
public interface ISuperAdminTenantService
{
    /// <summary>
    /// Gets all tenants with filtering and pagination
    /// </summary>
    Task<(IEnumerable<Models.Tenant> tenants, int totalCount)> GetTenantsAsync(
        string? searchTerm = null,
        bool? isActive = null,
        DateTime? createdAfter = null,
        DateTime? createdBefore = null,
        int page = 1,
        int pageSize = 50
    );

    /// <summary>
    /// Gets detailed tenant information including usage statistics
    /// </summary>
    Task<Models.Tenant?> GetTenantDetailsAsync(string tenantId, bool includeUsageStats = false);

    /// <summary>
    /// Creates a new tenant with validation
    /// </summary>
    Task<Models.Tenant> CreateTenantAsync(
        string tenantId,
        string name,
        string displayName,
        string? domain = null,
        Models.TenantConfiguration? configuration = null,
        Models.TenantTheme? theme = null,
        Models.TenantFeatures? features = null,
        string performedBy = null
    );

    /// <summary>
    /// Updates tenant information
    /// </summary>
    Task<Models.Tenant?> UpdateTenantAsync(
        string tenantId,
        string? displayName = null,
        string? domain = null,
        bool? isActive = null,
        Models.TenantConfiguration? configuration = null,
        Models.TenantTheme? theme = null,
        Models.TenantFeatures? features = null,
        string? performedBy = null
    );

    /// <summary>
    /// Suspends a tenant (sets IsActive = false)
    /// </summary>
    Task<bool> SuspendTenantAsync(string tenantId, string reason, string performedBy);

    /// <summary>
    /// Restores a suspended tenant
    /// </summary>
    Task<bool> RestoreTenantAsync(string tenantId, string performedBy);

    /// <summary>
    /// Deletes a tenant (soft delete, sets IsActive = false with special marker)
    /// </summary>
    Task<bool> DeleteTenantAsync(string tenantId, string reason, string performedBy);

    /// <summary>
    /// Gets tenant usage statistics
    /// </summary>
    Task<Dictionary<string, object>> GetTenantUsageAsync(string tenantId);

    /// <summary>
    /// Gets health status for a tenant
    /// </summary>
    Task<Dictionary<string, object>> GetTenantHealthAsync(string tenantId);

    /// <summary>
    /// Validates tenant configuration before applying changes
    /// </summary>
    Task<(bool isValid, string[] errors)> ValidateTenantConfigurationAsync(
        Models.TenantConfiguration? configuration,
        Models.TenantFeatures? features
    );
}

/// <summary>
/// Service for cross-tenant user management
/// </summary>
public interface ISuperAdminUserService
{
    /// <summary>
    /// Gets users across all tenants with filtering
    /// </summary>
    Task<(IEnumerable<Models.User> users, int totalCount)> GetUsersAsync(
        string? tenantId = null,
        string? searchTerm = null,
        string? role = null,
        DateTime? createdAfter = null,
        DateTime? lastActiveAfter = null,
        int page = 1,
        int pageSize = 50
    );

    /// <summary>
    /// Gets detailed user information including cross-tenant roles
    /// </summary>
    Task<Models.User?> GetUserDetailsAsync(int userId, string? tenantId = null);

    /// <summary>
    /// Creates a user in a specific tenant
    /// </summary>
    Task<Models.User> CreateUserAsync(
        string userName,
        string tenantId,
        string[]? roles = null,
        string? performedBy = null
    );

    /// <summary>
    /// Updates user information and roles
    /// </summary>
    Task<Models.User?> UpdateUserAsync(
        int userId,
        string? tenantId = null,
        string[]? roles = null,
        bool? isActive = null,
        string? performedBy = null
    );

    /// <summary>
    /// Deletes a user (soft delete)
    /// </summary>
    Task<bool> DeleteUserAsync(int userId, string tenantId, string reason, string performedBy);

    /// <summary>
    /// Resets user access (clears sessions, resets failed attempts)
    /// </summary>
    Task<bool> ResetUserAccessAsync(int userId, string tenantId, string performedBy);

    /// <summary>
    /// Gets user activity across tenants
    /// </summary>
    Task<Dictionary<string, object>> GetUserActivityAsync(int userId, DateTime fromDate, DateTime toDate);

    /// <summary>
    /// Performs bulk operations on users (role assignment, deactivation, etc.)
    /// </summary>
    Task<(int successful, int failed, string[] errors)> BulkUpdateUsersAsync(
        int[] userIds,
        string operation, // assign_role, revoke_role, deactivate, activate
        Dictionary<string, object> parameters,
        string performedBy
    );
}