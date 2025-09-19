using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PziApi.CrossCutting.Permissions;
using PziApi.CrossCutting.Settings;
using Microsoft.Extensions.Options;

namespace PziApi.CrossCutting.Auth;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
public class Auth0AuthorizeAttribute : Attribute, IAuthorizationFilter
{
  private readonly string[]? _requiredRoles;
  private readonly string[]? _requiredPermissions;
  private readonly string? _requiredTenant;
  private readonly bool _requireAnyRole;
  private readonly bool _requireAnyPermission;

  public Auth0AuthorizeAttribute(
    string? roles = null,
    string? permissions = null,
    string? tenant = null,
    bool requireAnyRole = false,
    bool requireAnyPermission = false)
  {
    _requiredRoles = roles?.Split(',', StringSplitOptions.RemoveEmptyEntries)
      .Select(r => r.Trim()).ToArray();
    _requiredPermissions = permissions?.Split(',', StringSplitOptions.RemoveEmptyEntries)
      .Select(p => p.Trim()).ToArray();
    _requiredTenant = tenant?.Trim();
    _requireAnyRole = requireAnyRole;
    _requireAnyPermission = requireAnyPermission;
  }

  public void OnAuthorization(AuthorizationFilterContext context)
  {
    var user = context.HttpContext.User;

    if (!user.Identity?.IsAuthenticated == true)
    {
      context.Result = new UnauthorizedResult();
      return;
    }

    // Check if all permissions should be granted (development/testing mode)
    var permissionOptions = context.HttpContext.RequestServices
      .GetService<IOptions<PermissionOptions>>();

    if (permissionOptions?.Value.GrantAllPermissions == true)
    {
      return; // Grant all permissions
    }

    // Check tenant restriction
    if (!string.IsNullOrEmpty(_requiredTenant))
    {
      var userTenant = user.FindFirst("tenant")?.Value;
      if (string.IsNullOrEmpty(userTenant) || !string.Equals(userTenant, _requiredTenant, StringComparison.OrdinalIgnoreCase))
      {
        context.Result = new ForbidResult($"Access restricted to tenant: {_requiredTenant}");
        return;
      }
    }

    // Check role requirements
    if (_requiredRoles != null && _requiredRoles.Length > 0)
    {
      var userRoles = user.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")
        .Select(c => c.Value)
        .ToList();

      var hasRequiredRole = _requireAnyRole
        ? _requiredRoles.Any(role => userRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
        : _requiredRoles.All(role => userRoles.Contains(role, StringComparer.OrdinalIgnoreCase));

      if (!hasRequiredRole)
      {
        var requiredRolesText = string.Join(", ", _requiredRoles);
        context.Result = new ForbidResult($"Required role(s): {requiredRolesText}");
        return;
      }
    }

    // Check permission requirements
    if (_requiredPermissions != null && _requiredPermissions.Length > 0)
    {
      var userPermissions = user.FindAll("permission")
        .Select(c => c.Value)
        .ToList();

      var hasRequiredPermission = _requireAnyPermission
        ? _requiredPermissions.Any(permission => userPermissions.Contains(permission, StringComparer.OrdinalIgnoreCase))
        : _requiredPermissions.All(permission => userPermissions.Contains(permission, StringComparer.OrdinalIgnoreCase));

      if (!hasRequiredPermission)
      {
        var requiredPermissionsText = string.Join(", ", _requiredPermissions);
        context.Result = new ForbidResult($"Required permission(s): {requiredPermissionsText}");
        return;
      }
    }

    // If we reach here, authorization is successful
  }
}

// Convenience attributes for common permission combinations
public class RequireRecordsViewAttribute : Auth0AuthorizeAttribute
{
  public RequireRecordsViewAttribute() : base(permissions: UserPermissions.RecordsView)
  {
  }
}

public class RequireRecordsEditAttribute : Auth0AuthorizeAttribute
{
  public RequireRecordsEditAttribute() : base(permissions: UserPermissions.RecordsEdit)
  {
  }
}

public class RequireListsViewAttribute : Auth0AuthorizeAttribute
{
  public RequireListsViewAttribute() : base(permissions: UserPermissions.ListsView)
  {
  }
}

public class RequireListsEditAttribute : Auth0AuthorizeAttribute
{
  public RequireListsEditAttribute() : base(permissions: UserPermissions.ListsEdit)
  {
  }
}

public class RequireJournalAccessAttribute : Auth0AuthorizeAttribute
{
  public RequireJournalAccessAttribute() : base(permissions: UserPermissions.JournalAccess)
  {
  }
}

public class RequireDocumentationDepartmentAttribute : Auth0AuthorizeAttribute
{
  public RequireDocumentationDepartmentAttribute() : base(permissions: UserPermissions.DocumentationDepartment)
  {
  }
}

public class RequireAdminRoleAttribute : Auth0AuthorizeAttribute
{
  public RequireAdminRoleAttribute() : base(roles: "admin")
  {
  }
}

public class RequireCuratorRoleAttribute : Auth0AuthorizeAttribute
{
  public RequireCuratorRoleAttribute() : base(roles: "curator")
  {
  }
}

public class RequireVeterinarianRoleAttribute : Auth0AuthorizeAttribute
{
  public RequireVeterinarianRoleAttribute() : base(roles: "veterinarian")
  {
  }
}

public class RequireTenantAttribute : Auth0AuthorizeAttribute
{
  public RequireTenantAttribute(string tenant) : base(tenant: tenant)
  {
  }
}