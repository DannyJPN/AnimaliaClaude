using PziApi.Services.SuperAdmin;
using PziApi.CrossCutting.Auth;

namespace PziApi.Extensions;

/// <summary>
/// Extension methods for configuring SuperAdmin services
/// </summary>
public static class SuperAdminServiceExtensions
{
    /// <summary>
    /// Adds SuperAdmin services to the service collection
    /// </summary>
    public static IServiceCollection AddSuperAdminServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Register core services
        services.AddScoped<ISuperAdminSecurityService, SuperAdminSecurityService>();
        services.AddScoped<ISuperAdminAuditService, SuperAdminAuditService>();
        services.AddScoped<ISuperAdminTenantService, SuperAdminTenantService>();
        services.AddScoped<ISuperAdminUserService, SuperAdminUserService>();

        // Register additional services that would be implemented
        // services.AddScoped<ISuperAdminNotificationService, SuperAdminNotificationService>();
        // services.AddScoped<ISuperAdminWebhookService, SuperAdminWebhookService>();
        // services.AddScoped<ISuperAdminHealthService, SuperAdminHealthService>();

        return services;
    }

    /// <summary>
    /// Configures SuperAdmin middleware in the request pipeline
    /// </summary>
    public static IApplicationBuilder UseSuperAdminServices(this IApplicationBuilder app)
    {
        // Add SuperAdmin audit middleware
        app.UseMiddleware<SuperAdminAuditMiddleware>();

        return app;
    }

    /// <summary>
    /// Seeds initial SuperAdmin user if configured
    /// </summary>
    public static async Task SeedSuperAdminUserAsync(this IServiceProvider services, IConfiguration configuration)
    {
        using var scope = services.CreateScope();
        var securityService = scope.ServiceProvider.GetRequiredService<ISuperAdminSecurityService>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<SuperAdminSecurityService>>();

        // Check if initial superadmin is configured
        var initialAdmin = configuration.GetSection("SuperAdmin:InitialUser");
        var userId = initialAdmin["UserId"];
        var email = initialAdmin["Email"];
        var name = initialAdmin["Name"];

        if (!string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(email) && !string.IsNullOrEmpty(name))
        {
            try
            {
                var exists = await securityService.IsSuperAdminAsync(userId);
                if (!exists)
                {
                    await securityService.CreateOrUpdateSuperAdminAsync(
                        userId, email, name, "SuperAdmin", scopedToTenantId: null);

                    logger.LogInformation("Initial SuperAdmin user created: {UserId} ({Email})", userId, email);
                }
                else
                {
                    logger.LogInformation("SuperAdmin user already exists: {UserId}", userId);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to seed initial SuperAdmin user");
            }
        }
        else
        {
            logger.LogWarning("Initial SuperAdmin user configuration is incomplete. Please configure SuperAdmin:InitialUser section.");
        }
    }
}

/// <summary>
/// Simple placeholder implementation for SuperAdminUserService
/// This would need to be fully implemented for production use
/// </summary>
public class SuperAdminUserService : ISuperAdminUserService
{
    private readonly PziApi.CrossCutting.Database.PziDbContext _dbContext;
    private readonly ILogger<SuperAdminUserService> _logger;

    public SuperAdminUserService(
        PziApi.CrossCutting.Database.PziDbContext dbContext,
        ILogger<SuperAdminUserService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public Task<(IEnumerable<PziApi.Models.User> users, int totalCount)> GetUsersAsync(
        string? tenantId = null, string? searchTerm = null, string? role = null,
        DateTime? createdAfter = null, DateTime? lastActiveAfter = null,
        int page = 1, int pageSize = 50)
    {
        // TODO: Implement cross-tenant user retrieval
        // This requires bypassing tenant filters and implementing proper cross-tenant queries
        var emptyResult = (Enumerable.Empty<PziApi.Models.User>(), 0);
        return Task.FromResult(emptyResult);
    }

    public Task<PziApi.Models.User?> GetUserDetailsAsync(int userId, string? tenantId = null)
    {
        // TODO: Implement user details retrieval
        return Task.FromResult<PziApi.Models.User?>(null);
    }

    public Task<PziApi.Models.User> CreateUserAsync(string userName, string tenantId, string[]? roles = null, string? performedBy = null)
    {
        throw new NotImplementedException("User creation not yet implemented");
    }

    public Task<PziApi.Models.User?> UpdateUserAsync(int userId, string? tenantId = null, string[]? roles = null, bool? isActive = null, string? performedBy = null)
    {
        throw new NotImplementedException("User update not yet implemented");
    }

    public Task<bool> DeleteUserAsync(int userId, string tenantId, string reason, string performedBy)
    {
        throw new NotImplementedException("User deletion not yet implemented");
    }

    public Task<bool> ResetUserAccessAsync(int userId, string tenantId, string performedBy)
    {
        throw new NotImplementedException("User reset not yet implemented");
    }

    public Task<Dictionary<string, object>> GetUserActivityAsync(int userId, DateTime fromDate, DateTime toDate)
    {
        // TODO: Implement user activity tracking
        return Task.FromResult(new Dictionary<string, object>
        {
            ["message"] = "User activity tracking not yet implemented"
        });
    }

    public Task<(int successful, int failed, string[] errors)> BulkUpdateUsersAsync(
        int[] userIds, string operation, Dictionary<string, object> parameters, string performedBy)
    {
        // TODO: Implement bulk operations
        return Task.FromResult((0, userIds.Length, new[] { "Bulk operations not yet implemented" }));
    }
}