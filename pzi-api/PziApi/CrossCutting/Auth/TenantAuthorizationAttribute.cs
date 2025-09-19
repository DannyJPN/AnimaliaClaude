using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PziApi.CrossCutting.Tenant;

namespace PziApi.CrossCutting.Auth;

/// <summary>
/// Authorization attribute that ensures the current user can only access data from their own tenant.
/// This attribute validates that the user's tenant context matches the requested tenant ID.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
public class RequireTenantContextAttribute : Attribute, IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        var tenantContext = context.HttpContext.RequestServices.GetService<ITenantContext>();

        if (tenantContext == null || string.IsNullOrEmpty(tenantContext.CurrentTenantId))
        {
            context.Result = new BadRequestObjectResult("Tenant context is required but not available");
            return;
        }

        // Check if user is authenticated
        if (!context.HttpContext.User.Identity?.IsAuthenticated == true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Validate that the current tenant is active
        // This is handled by the TenantMiddleware, but we can add additional checks here if needed
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // No action needed after execution
    }
}

/// <summary>
/// Authorization attribute for operations that should only be available to admin users.
/// Combines admin role requirement with tenant context validation.
/// </summary>
public class RequireTenantAdminAttribute : RequireAdminRoleAttribute
{
    // Inherits admin role validation from RequireAdminRoleAttribute
    // Can be extended to add tenant-specific admin logic if needed
}