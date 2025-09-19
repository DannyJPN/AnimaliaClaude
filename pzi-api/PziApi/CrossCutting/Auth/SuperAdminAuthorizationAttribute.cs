using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PziApi.CrossCutting.Permissions;
using PziApi.Services.SuperAdmin;

namespace PziApi.CrossCutting.Auth;

/// <summary>
/// Authorization attribute for superadmin operations
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequireSuperAdminAttribute : Attribute, IAsyncActionFilter
{
    private readonly string[]? _requiredPermissions;
    private readonly bool _requireAll;

    public RequireSuperAdminAttribute(string? permissions = null, bool requireAll = true)
    {
        _requiredPermissions = permissions?.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Trim()).ToArray();
        _requireAll = requireAll;
    }

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;

        if (!user.Identity?.IsAuthenticated == true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        var superAdminService = context.HttpContext.RequestServices
            .GetRequiredService<ISuperAdminSecurityService>();

        // Validate superadmin status
        var userId = user.FindFirst("sub")?.Value ?? user.FindFirst("user_id")?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new UnauthorizedObjectResult("User ID not found in token");
            return;
        }

        var isSuperAdmin = await superAdminService.IsSuperAdminAsync(userId);
        if (!isSuperAdmin)
        {
            context.Result = new ForbidResult("Superadmin access required");
            return;
        }

        // Check specific permissions if required
        if (_requiredPermissions != null && _requiredPermissions.Length > 0)
        {
            var hasPermissions = await superAdminService.HasPermissionsAsync(userId, _requiredPermissions, _requireAll);
            if (!hasPermissions)
            {
                var permissionsText = string.Join(", ", _requiredPermissions);
                context.Result = new ForbidResult($"Required superadmin permission(s): {permissionsText}");
                return;
            }
        }

        await next();
    }
}

/// <summary>
/// Convenience attributes for common superadmin permission combinations
/// </summary>
public class RequireTenantManagementAttribute : RequireSuperAdminAttribute
{
    public RequireTenantManagementAttribute()
        : base(SuperAdminPermissions.TenantsView) { }
}

public class RequireTenantCreateAttribute : RequireSuperAdminAttribute
{
    public RequireTenantCreateAttribute()
        : base(SuperAdminPermissions.TenantsCreate) { }
}

public class RequireTenantEditAttribute : RequireSuperAdminAttribute
{
    public RequireTenantEditAttribute()
        : base(SuperAdminPermissions.TenantsEdit) { }
}

public class RequireUserManagementAttribute : RequireSuperAdminAttribute
{
    public RequireUserManagementAttribute()
        : base(SuperAdminPermissions.UsersViewAll) { }
}

public class RequireUserImpersonationAttribute : RequireSuperAdminAttribute
{
    public RequireUserImpersonationAttribute()
        : base(SuperAdminPermissions.UsersImpersonate) { }
}

public class RequireAuditAccessAttribute : RequireSuperAdminAttribute
{
    public RequireAuditAccessAttribute()
        : base(SuperAdminPermissions.AuditView) { }
}

public class RequireSystemManagementAttribute : RequireSuperAdminAttribute
{
    public RequireSystemManagementAttribute()
        : base($"{SuperAdminPermissions.SystemHealth},{SuperAdminPermissions.SystemMetrics}", requireAll: false) { }
}

public class RequireBreakGlassAttribute : RequireSuperAdminAttribute
{
    public RequireBreakGlassAttribute()
        : base(SuperAdminPermissions.BreakGlass) { }
}

/// <summary>
/// Middleware to track superadmin operations for audit purposes
/// </summary>
public class SuperAdminAuditMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<SuperAdminAuditMiddleware> _logger;

    public SuperAdminAuditMiddleware(RequestDelegate next, ILogger<SuperAdminAuditMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower();
        var isSuperAdminRequest = path?.Contains("/superadmin/") == true;

        if (isSuperAdminRequest && context.User.Identity?.IsAuthenticated == true)
        {
            var auditService = context.HttpContext.RequestServices
                .GetService<ISuperAdminAuditService>();

            if (auditService != null)
            {
                var correlationId = context.TraceIdentifier;
                context.Items["SuperAdminCorrelationId"] = correlationId;

                // Log request initiation
                var userId = context.User.FindFirst("sub")?.Value ?? context.User.FindFirst("user_id")?.Value;
                if (!string.IsNullOrEmpty(userId))
                {
                    await auditService.LogOperationAsync(
                        operation: $"{context.Request.Method} {context.Request.Path}",
                        entityType: "HTTP_REQUEST",
                        entityId: null,
                        performedBy: userId,
                        correlationId: correlationId,
                        beforeData: null,
                        afterData: null,
                        context: context.Request.QueryString.ToString(),
                        severity: "Info"
                    );
                }
            }
        }

        await _next(context);
    }
}