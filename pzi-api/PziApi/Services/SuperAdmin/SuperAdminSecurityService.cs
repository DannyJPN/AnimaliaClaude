using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using PziApi.CrossCutting.Database;
using PziApi.Models.SuperAdmin;
using PziApi.CrossCutting.Permissions;

namespace PziApi.Services.SuperAdmin;

public class SuperAdminSecurityService : ISuperAdminSecurityService
{
    private readonly PziDbContext _dbContext;
    private readonly ISuperAdminAuditService _auditService;
    private readonly ILogger<SuperAdminSecurityService> _logger;
    private readonly IHttpContextAccessor _httpContextAccessor;

    private const int MaxFailedAttempts = 5;
    private const int LockoutDurationMinutes = 15;

    public SuperAdminSecurityService(
        PziDbContext dbContext,
        ISuperAdminAuditService auditService,
        ILogger<SuperAdminSecurityService> logger,
        IHttpContextAccessor httpContextAccessor)
    {
        _dbContext = dbContext;
        _auditService = auditService;
        _logger = logger;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<bool> IsSuperAdminAsync(string userId)
    {
        var superAdminUser = await _dbContext.Set<SuperAdminUser>()
            .Where(u => u.UserId == userId && u.IsActive)
            .FirstOrDefaultAsync();

        return superAdminUser != null;
    }

    public async Task<bool> HasPermissionsAsync(string userId, string[] permissions, bool requireAll = true)
    {
        var userPermissions = await GetUserPermissionsAsync(userId);

        if (requireAll)
        {
            return permissions.All(p => userPermissions.Contains(p, StringComparer.OrdinalIgnoreCase));
        }
        else
        {
            return permissions.Any(p => userPermissions.Contains(p, StringComparer.OrdinalIgnoreCase));
        }
    }

    public async Task<string[]> GetUserPermissionsAsync(string userId)
    {
        var superAdminUser = await _dbContext.Set<SuperAdminUser>()
            .Where(u => u.UserId == userId && u.IsActive)
            .FirstOrDefaultAsync();

        if (superAdminUser == null)
            return Array.Empty<string>();

        // Return role-based permissions
        return superAdminUser.Role.ToLower() switch
        {
            "superadmin" => SuperAdminPermissions.SuperAdminRole,
            "tenantadmin" => SuperAdminPermissions.TenantAdminRole,
            "readonly" => SuperAdminPermissions.ReadOnlyRole,
            _ => superAdminUser.GetPermissions()
        };
    }

    public async Task<bool> CreateOrUpdateSuperAdminAsync(string userId, string email, string name, string role, string[]? permissions = null, string? scopedToTenantId = null)
    {
        try
        {
            var existingUser = await _dbContext.Set<SuperAdminUser>()
                .Where(u => u.UserId == userId)
                .FirstOrDefaultAsync();

            var currentUserId = GetCurrentUserId();
            var correlationId = GetCorrelationId();

            if (existingUser != null)
            {
                var beforeData = JsonSerializer.Serialize(new {
                    existingUser.Name, existingUser.Email, existingUser.Role,
                    existingUser.IsActive, existingUser.ScopedToTenantId
                });

                existingUser.Email = email;
                existingUser.Name = name;
                existingUser.Role = role;
                existingUser.ScopedToTenantId = scopedToTenantId;
                existingUser.UpdatedAt = DateTime.UtcNow;
                existingUser.LastModifiedBy = currentUserId;

                if (permissions != null)
                {
                    existingUser.SetPermissions(permissions);
                }

                await _dbContext.SaveChangesAsync();

                var afterData = JsonSerializer.Serialize(new {
                    existingUser.Name, existingUser.Email, existingUser.Role,
                    existingUser.IsActive, existingUser.ScopedToTenantId
                });

                await _auditService.LogOperationAsync(
                    SuperAdminAuditOperations.UserUpdate,
                    "SuperAdminUser",
                    userId,
                    currentUserId ?? "system",
                    correlationId,
                    beforeData,
                    afterData,
                    $"Updated superadmin user: {email}"
                );
            }
            else
            {
                var newUser = new SuperAdminUser
                {
                    UserId = userId,
                    Email = email,
                    Name = name,
                    Role = role,
                    IsActive = true,
                    ScopedToTenantId = scopedToTenantId,
                    CreatedBy = currentUserId,
                    LastModifiedBy = currentUserId
                };

                if (permissions != null)
                {
                    newUser.SetPermissions(permissions);
                }

                _dbContext.Set<SuperAdminUser>().Add(newUser);
                await _dbContext.SaveChangesAsync();

                var afterData = JsonSerializer.Serialize(new {
                    newUser.Name, newUser.Email, newUser.Role,
                    newUser.IsActive, newUser.ScopedToTenantId
                });

                await _auditService.LogOperationAsync(
                    SuperAdminAuditOperations.UserCreate,
                    "SuperAdminUser",
                    userId,
                    currentUserId ?? "system",
                    correlationId,
                    null,
                    afterData,
                    $"Created superadmin user: {email}"
                );
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create or update superadmin user {UserId}", userId);
            return false;
        }
    }

    public async Task<bool> DeactivateSuperAdminAsync(string userId, string performedBy)
    {
        try
        {
            var user = await _dbContext.Set<SuperAdminUser>()
                .Where(u => u.UserId == userId)
                .FirstOrDefaultAsync();

            if (user == null)
                return false;

            var beforeData = JsonSerializer.Serialize(new { user.IsActive });

            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;
            user.LastModifiedBy = performedBy;

            // Terminate all active sessions
            await TerminateAllSessionsAsync(userId, "User deactivated");

            await _dbContext.SaveChangesAsync();

            var afterData = JsonSerializer.Serialize(new { user.IsActive });

            await _auditService.LogOperationAsync(
                SuperAdminAuditOperations.UserUpdate,
                "SuperAdminUser",
                userId,
                performedBy,
                GetCorrelationId(),
                beforeData,
                afterData,
                "Deactivated superadmin user",
                severity: "Warning"
            );

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to deactivate superadmin user {UserId}", userId);
            return false;
        }
    }

    public async Task<string?> StartImpersonationAsync(string superAdminUserId, string tenantId, string? targetUserId = null, int sessionDurationMinutes = 30)
    {
        try
        {
            // Validate superadmin has impersonation permission
            var hasPermission = await HasPermissionsAsync(superAdminUserId, new[] { SuperAdminPermissions.UsersImpersonate });
            if (!hasPermission)
                return null;

            var sessionToken = GenerateSecureToken();
            var session = new SuperAdminSession
            {
                UserId = superAdminUserId,
                SessionToken = sessionToken,
                ImpersonatedTenantId = tenantId,
                ImpersonatedUserId = targetUserId,
                IpAddress = GetClientIpAddress(),
                UserAgent = GetUserAgent(),
                ExpiresAt = DateTime.UtcNow.AddMinutes(sessionDurationMinutes),
                Status = "Active"
            };

            _dbContext.Set<SuperAdminSession>().Add(session);
            await _dbContext.SaveChangesAsync();

            await _auditService.LogOperationAsync(
                SuperAdminAuditOperations.UserImpersonateStart,
                "SuperAdminSession",
                sessionToken,
                superAdminUserId,
                GetCorrelationId(),
                null,
                JsonSerializer.Serialize(new { tenantId, targetUserId, sessionDurationMinutes }),
                $"Started impersonation session for tenant {tenantId}",
                severity: "Warning",
                impersonatedTenantId: tenantId
            );

            return sessionToken;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to start impersonation session for user {UserId}", superAdminUserId);
            return null;
        }
    }

    public async Task<bool> EndImpersonationAsync(string sessionToken)
    {
        try
        {
            var session = await _dbContext.Set<SuperAdminSession>()
                .Where(s => s.SessionToken == sessionToken && s.IsActive)
                .FirstOrDefaultAsync();

            if (session == null)
                return false;

            session.TerminatedAt = DateTime.UtcNow;
            session.Status = "Terminated";

            await _dbContext.SaveChangesAsync();

            await _auditService.LogOperationAsync(
                SuperAdminAuditOperations.UserImpersonateEnd,
                "SuperAdminSession",
                sessionToken,
                session.UserId,
                GetCorrelationId(),
                null,
                JsonSerializer.Serialize(new { session.ImpersonatedTenantId, session.ImpersonatedUserId }),
                $"Ended impersonation session",
                severity: "Warning",
                impersonatedTenantId: session.ImpersonatedTenantId
            );

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to end impersonation session {SessionToken}", sessionToken);
            return false;
        }
    }

    public async Task<(string? TenantId, string? UserId)> GetImpersonationContextAsync(string sessionToken)
    {
        var session = await _dbContext.Set<SuperAdminSession>()
            .Where(s => s.SessionToken == sessionToken && s.IsActive)
            .FirstOrDefaultAsync();

        if (session == null)
            return (null, null);

        return (session.ImpersonatedTenantId, session.ImpersonatedUserId);
    }

    public async Task<bool> ValidateSessionAsync(string userId, string sessionToken)
    {
        var session = await _dbContext.Set<SuperAdminSession>()
            .Where(s => s.UserId == userId && s.SessionToken == sessionToken && s.IsActive)
            .FirstOrDefaultAsync();

        return session != null;
    }

    public async Task TerminateAllSessionsAsync(string userId, string reason)
    {
        var sessions = await _dbContext.Set<SuperAdminSession>()
            .Where(s => s.UserId == userId && s.Status == "Active")
            .ToListAsync();

        foreach (var session in sessions)
        {
            session.TerminatedAt = DateTime.UtcNow;
            session.Status = "Terminated";
        }

        if (sessions.Any())
        {
            await _dbContext.SaveChangesAsync();

            await _auditService.LogOperationAsync(
                SuperAdminAuditOperations.SessionTerminate,
                "SuperAdminSession",
                null,
                GetCurrentUserId() ?? "system",
                GetCorrelationId(),
                null,
                JsonSerializer.Serialize(new { terminatedCount = sessions.Count, reason }),
                $"Terminated all sessions for user: {reason}",
                severity: "Warning"
            );
        }
    }

    public async Task<IEnumerable<SuperAdminSession>> GetActiveSessionsAsync(string userId)
    {
        return await _dbContext.Set<SuperAdminSession>()
            .Where(s => s.UserId == userId && s.IsActive)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task HandleFailedLoginAsync(string userId, string ipAddress)
    {
        var user = await _dbContext.Set<SuperAdminUser>()
            .Where(u => u.UserId == userId)
            .FirstOrDefaultAsync();

        if (user != null)
        {
            user.FailedLoginAttempts++;

            if (user.FailedLoginAttempts >= MaxFailedAttempts)
            {
                user.LockedUntil = DateTime.UtcNow.AddMinutes(LockoutDurationMinutes);

                await _auditService.LogOperationAsync(
                    SuperAdminAuditOperations.UserLockout,
                    "SuperAdminUser",
                    userId,
                    "system",
                    GetCorrelationId(),
                    null,
                    JsonSerializer.Serialize(new { lockoutUntil = user.LockedUntil, ipAddress }),
                    $"User locked out after {MaxFailedAttempts} failed attempts",
                    severity: "Critical"
                );
            }

            await _dbContext.SaveChangesAsync();
        }
    }

    public async Task HandleSuccessfulLoginAsync(string userId, string ipAddress, string userAgent, string sessionToken)
    {
        var user = await _dbContext.Set<SuperAdminUser>()
            .Where(u => u.UserId == userId)
            .FirstOrDefaultAsync();

        if (user != null)
        {
            user.LastLoginAt = DateTime.UtcNow;
            user.LastLoginIp = ipAddress;
            user.FailedLoginAttempts = 0;
            user.LockedUntil = null;

            await _dbContext.SaveChangesAsync();

            await _auditService.LogOperationAsync(
                SuperAdminAuditOperations.UserLogin,
                "SuperAdminUser",
                userId,
                userId,
                GetCorrelationId(),
                null,
                JsonSerializer.Serialize(new { ipAddress, userAgent, sessionToken }),
                "Superadmin user login successful"
            );
        }
    }

    public async Task<bool> IsUserLockedOutAsync(string userId)
    {
        var user = await _dbContext.Set<SuperAdminUser>()
            .Where(u => u.UserId == userId)
            .FirstOrDefaultAsync();

        return user?.LockedUntil > DateTime.UtcNow;
    }

    private string GenerateSecureToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var bytes = new byte[32];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    private string GetClientIpAddress()
    {
        var context = _httpContextAccessor.HttpContext;
        return context?.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    private string GetUserAgent()
    {
        var context = _httpContextAccessor.HttpContext;
        return context?.Request.Headers["User-Agent"].ToString() ?? "unknown";
    }

    private string? GetCurrentUserId()
    {
        var context = _httpContextAccessor.HttpContext;
        return context?.User.FindFirst("sub")?.Value ?? context?.User.FindFirst("user_id")?.Value;
    }

    private string GetCorrelationId()
    {
        var context = _httpContextAccessor.HttpContext;
        return context?.Items["SuperAdminCorrelationId"]?.ToString() ?? context?.TraceIdentifier ?? Guid.NewGuid().ToString();
    }
}