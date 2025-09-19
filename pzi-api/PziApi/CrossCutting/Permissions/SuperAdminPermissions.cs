namespace PziApi.CrossCutting.Permissions;

/// <summary>
/// Defines all superadmin-level permissions for centralized tenant and user management
/// </summary>
public static class SuperAdminPermissions
{
    // Tenant Management
    public const string TenantsView = "superadmin:tenants:view";
    public const string TenantsCreate = "superadmin:tenants:create";
    public const string TenantsEdit = "superadmin:tenants:edit";
    public const string TenantsDelete = "superadmin:tenants:delete";
    public const string TenantsSuspend = "superadmin:tenants:suspend";
    public const string TenantsRestore = "superadmin:tenants:restore";

    // Cross-Tenant User Management
    public const string UsersViewAll = "superadmin:users:view-all";
    public const string UsersCreateAny = "superadmin:users:create-any";
    public const string UsersEditAny = "superadmin:users:edit-any";
    public const string UsersDeleteAny = "superadmin:users:delete-any";
    public const string UsersImpersonate = "superadmin:users:impersonate";
    public const string UsersResetAccess = "superadmin:users:reset-access";

    // Role and Permission Management
    public const string RolesView = "superadmin:roles:view";
    public const string RolesManage = "superadmin:roles:manage";
    public const string PermissionsView = "superadmin:permissions:view";
    public const string PermissionsManage = "superadmin:permissions:manage";

    // Audit and Security
    public const string AuditView = "superadmin:audit:view";
    public const string AuditExport = "superadmin:audit:export";
    public const string SecurityManage = "superadmin:security:manage";
    public const string SecurityMonitor = "superadmin:security:monitor";

    // System Operations
    public const string SystemHealth = "superadmin:system:health";
    public const string SystemMetrics = "superadmin:system:metrics";
    public const string SystemBackup = "superadmin:system:backup";
    public const string SystemRestore = "superadmin:system:restore";

    // Data Management
    public const string DataExport = "superadmin:data:export";
    public const string DataImport = "superadmin:data:import";
    public const string DataMigration = "superadmin:data:migration";

    // Notification and Webhook Management
    public const string NotificationsManage = "superadmin:notifications:manage";
    public const string WebhooksManage = "superadmin:webhooks:manage";
    public const string WebhooksView = "superadmin:webhooks:view";

    // Feature Flag Management
    public const string FeatureFlagsView = "superadmin:features:view";
    public const string FeatureFlagsManage = "superadmin:features:manage";

    // Break Glass Operations (emergency access)
    public const string BreakGlass = "superadmin:emergency:break-glass";

    /// <summary>
    /// Gets all superadmin permissions for a superadmin role
    /// </summary>
    public static readonly string[] SuperAdminRole = new[]
    {
        TenantsView, TenantsCreate, TenantsEdit, TenantsDelete, TenantsSuspend, TenantsRestore,
        UsersViewAll, UsersCreateAny, UsersEditAny, UsersDeleteAny, UsersImpersonate, UsersResetAccess,
        RolesView, RolesManage, PermissionsView, PermissionsManage,
        AuditView, AuditExport, SecurityManage, SecurityMonitor,
        SystemHealth, SystemMetrics, SystemBackup, SystemRestore,
        DataExport, DataImport, DataMigration,
        NotificationsManage, WebhooksManage, WebhooksView,
        FeatureFlagsView, FeatureFlagsManage,
        BreakGlass
    };

    /// <summary>
    /// Gets permissions for a tenant-scoped admin role
    /// </summary>
    public static readonly string[] TenantAdminRole = new[]
    {
        // Limited to own tenant operations
        UsersViewAll, UsersCreateAny, UsersEditAny, // No delete or impersonate
        RolesView, PermissionsView,
        AuditView, // No export
        SystemHealth, SystemMetrics,
        DataExport, // Limited to own tenant data
        FeatureFlagsView
    };

    /// <summary>
    /// Gets read-only permissions for monitoring/support roles
    /// </summary>
    public static readonly string[] ReadOnlyRole = new[]
    {
        TenantsView,
        UsersViewAll,
        RolesView, PermissionsView,
        AuditView,
        SystemHealth, SystemMetrics,
        FeatureFlagsView, WebhooksView
    };
}

/// <summary>
/// Defines audit operation types for consistent logging
/// </summary>
public static class SuperAdminAuditOperations
{
    // Tenant operations
    public const string TenantCreate = "tenant.create";
    public const string TenantUpdate = "tenant.update";
    public const string TenantSuspend = "tenant.suspend";
    public const string TenantRestore = "tenant.restore";
    public const string TenantDelete = "tenant.delete";

    // User operations
    public const string UserCreate = "user.create";
    public const string UserUpdate = "user.update";
    public const string UserDelete = "user.delete";
    public const string UserImpersonateStart = "user.impersonate.start";
    public const string UserImpersonateEnd = "user.impersonate.end";
    public const string UserResetAccess = "user.reset.access";
    public const string UserLogin = "user.login";
    public const string UserLogout = "user.logout";
    public const string UserLockout = "user.lockout";

    // Role operations
    public const string RoleAssign = "role.assign";
    public const string RoleRevoke = "role.revoke";
    public const string PermissionGrant = "permission.grant";
    public const string PermissionRevoke = "permission.revoke";

    // System operations
    public const string SystemBackup = "system.backup";
    public const string SystemRestore = "system.restore";
    public const string FeatureFlagUpdate = "feature.flag.update";
    public const string NotificationCreate = "notification.create";
    public const string WebhookCreate = "webhook.create";
    public const string WebhookUpdate = "webhook.update";

    // Data operations
    public const string DataExport = "data.export";
    public const string DataImport = "data.import";

    // Security operations
    public const string BreakGlassAccess = "security.break.glass";
    public const string SecurityPolicyUpdate = "security.policy.update";
    public const string SessionTerminate = "session.terminate";
}

/// <summary>
/// Defines event types for notifications
/// </summary>
public static class SuperAdminEventTypes
{
    public const string TenantCreated = "tenant.created";
    public const string TenantUpdated = "tenant.updated";
    public const string TenantSuspended = "tenant.suspended";
    public const string TenantRestored = "tenant.restored";

    public const string UserCreated = "user.created";
    public const string UserUpdated = "user.updated";
    public const string UserDeleted = "user.deleted";
    public const string UserImpersonated = "user.impersonated";

    public const string SecurityAlert = "security.alert";
    public const string SystemHealthAlert = "system.health.alert";
    public const string AuditAlert = "audit.alert";

    public const string DataExportCompleted = "data.export.completed";
    public const string BackupCompleted = "backup.completed";
}