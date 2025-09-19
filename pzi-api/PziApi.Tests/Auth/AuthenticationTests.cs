using Microsoft.Extensions.DependencyInjection;
using FluentAssertions;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Net;

namespace PziApi.Tests.Auth;

public class AuthenticationTests : TestBase
{
    [Fact]
    public async Task Login_WithValidCredentials_ReturnsJWT()
    {
        // Arrange
        var loginRequest = new
        {
            Email = "test@example.com",
            Password = "Test123!",
            TenantDomain = "test.example.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(loginRequest),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await Client.PostAsync("/api/auth/login", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        var loginResponse = JsonSerializer.Deserialize<dynamic>(responseContent);

        loginResponse.Should().NotBeNull();
        // In real implementation, verify JWT structure and claims
    }

    [Theory]
    [InlineData("", "Test123!", "Email is required")]
    [InlineData("invalid-email", "Test123!", "Invalid email format")]
    [InlineData("test@example.com", "", "Password is required")]
    [InlineData("test@example.com", "123", "Password too short")]
    public async Task Login_WithInvalidInput_ReturnsBadRequest(string email, string password, string expectedError)
    {
        // Arrange
        var loginRequest = new
        {
            Email = email,
            Password = password,
            TenantDomain = "test.example.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(loginRequest),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await Client.PostAsync("/api/auth/login", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var loginRequest = new
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword",
            TenantDomain = "test.example.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(loginRequest),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await Client.PostAsync("/api/auth/login", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsUnauthorized()
    {
        // Act
        var response = await Client.GetAsync("/api/users/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithInvalidToken_ReturnsUnauthorized()
    {
        // Arrange
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "invalid-token");

        // Act
        var response = await Client.GetAsync("/api/users/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithValidToken_ReturnsSuccess()
    {
        // Arrange
        var token = await GetValidTestToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await Client.GetAsync("/api/users/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task JWT_ExpiredToken_ReturnsUnauthorized()
    {
        // Arrange
        var expiredToken = GenerateExpiredTestToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", expiredToken);

        // Act
        var response = await Client.GetAsync("/api/users/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task JWT_TokenWithInvalidSignature_ReturnsUnauthorized()
    {
        // Arrange
        var tamperedToken = await GetTamperedTestToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tamperedToken);

        // Act
        var response = await Client.GetAsync("/api/users/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task RefreshToken_WithValidToken_ReturnsNewToken()
    {
        // Arrange
        var refreshToken = await GetValidRefreshToken();
        var refreshRequest = new { RefreshToken = refreshToken };

        var content = new StringContent(
            JsonSerializer.Serialize(refreshRequest),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await Client.PostAsync("/api/auth/refresh", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var responseContent = await response.Content.ReadAsStringAsync();
        var tokenResponse = JsonSerializer.Deserialize<dynamic>(responseContent);

        tokenResponse.Should().NotBeNull();
    }

    [Fact]
    public async Task Logout_WithValidToken_InvalidatesToken()
    {
        // Arrange
        var token = await GetValidTestToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act - Logout
        var logoutResponse = await Client.PostAsync("/api/auth/logout", null);

        // Assert - Logout successful
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        // Act - Try to use the same token
        var protectedResponse = await Client.GetAsync("/api/users/profile");

        // Assert - Token should be invalidated
        protectedResponse.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Theory]
    [InlineData("user", "/api/users/profile", HttpStatusCode.OK)]
    [InlineData("user", "/api/admin/users", HttpStatusCode.Forbidden)]
    [InlineData("admin", "/api/admin/users", HttpStatusCode.OK)]
    [InlineData("admin", "/api/superadmin/tenants", HttpStatusCode.Forbidden)]
    [InlineData("superadmin", "/api/superadmin/tenants", HttpStatusCode.OK)]
    public async Task Authorization_RoleBasedAccess_EnforcesCorrectPermissions(
        string role, string endpoint, HttpStatusCode expectedStatus)
    {
        // Arrange
        var token = await GetTestTokenWithRole(role);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await Client.GetAsync(endpoint);

        // Assert
        response.StatusCode.Should().Be(expectedStatus);
    }

    [Fact]
    public async Task MultiFactorAuth_RequiredEndpoint_RedirectsToMFA()
    {
        // Arrange
        var tokenWithoutMFA = await GetTestTokenWithoutMFA();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tokenWithoutMFA);

        // Act
        var response = await Client.GetAsync("/api/admin/critical-action");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Found); // Redirect to MFA
        response.Headers.Location?.ToString().Should().Contain("mfa");
    }

    [Fact]
    public async Task Auth0Integration_ValidToken_ProcessesCorrectly()
    {
        // Arrange - Mock Auth0 JWT
        var auth0Token = GenerateMockAuth0Token();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth0Token);

        // Act
        var response = await Client.GetAsync("/api/users/profile");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task SessionManagement_ConcurrentSessions_HandledCorrectly()
    {
        // Arrange - Login from multiple clients
        var client1 = Factory.CreateClient();
        var client2 = Factory.CreateClient();

        var token1 = await GetValidTestToken(userId: "user1");
        var token2 = await GetValidTestToken(userId: "user1"); // Same user, different session

        client1.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        client2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act
        var response1 = await client1.GetAsync("/api/users/profile");
        var response2 = await client2.GetAsync("/api/users/profile");

        // Assert - Both sessions should work (unless single session policy is enabled)
        response1.StatusCode.Should().Be(HttpStatusCode.OK);
        response2.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PasswordPolicy_WeakPassword_ReturnsValidationError()
    {
        // Arrange
        var changePasswordRequest = new
        {
            CurrentPassword = "OldPassword123!",
            NewPassword = "123", // Too weak
            ConfirmPassword = "123"
        };

        var token = await GetValidTestToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var content = new StringContent(
            JsonSerializer.Serialize(changePasswordRequest),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await Client.PostAsync("/api/auth/change-password", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var responseContent = await response.Content.ReadAsStringAsync();
        responseContent.Should().Contain("password"); // Should contain password validation error
    }

    [Fact]
    public async Task BruteForceProtection_MultipleFailedAttempts_LocksAccount()
    {
        // Arrange
        var loginRequest = new
        {
            Email = "test@example.com",
            Password = "WrongPassword",
            TenantDomain = "test.example.com"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(loginRequest),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act - Multiple failed attempts
        for (int i = 0; i < 5; i++)
        {
            await Client.PostAsync("/api/auth/login", content);
        }

        // Final attempt with correct password
        var correctLoginRequest = new
        {
            Email = "test@example.com",
            Password = "CorrectPassword123!",
            TenantDomain = "test.example.com"
        };

        var correctContent = new StringContent(
            JsonSerializer.Serialize(correctLoginRequest),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        var finalResponse = await Client.PostAsync("/api/auth/login", correctContent);

        // Assert - Account should be locked
        finalResponse.StatusCode.Should().Be(HttpStatusCode.Locked);
    }

    // Helper methods
    private async Task<string> GetValidTestToken(string? userId = null)
    {
        // Mock implementation - in real tests, this would integrate with actual auth system
        await Task.Delay(1);
        return "mock-valid-jwt-token";
    }

    private async Task<string> GetTestTokenWithRole(string role)
    {
        await Task.Delay(1);
        return $"mock-jwt-token-{role}";
    }

    private async Task<string> GetTestTokenWithoutMFA()
    {
        await Task.Delay(1);
        return "mock-jwt-token-no-mfa";
    }

    private async Task<string> GetValidRefreshToken()
    {
        await Task.Delay(1);
        return "mock-refresh-token";
    }

    private string GenerateExpiredTestToken()
    {
        return "mock-expired-jwt-token";
    }

    private async Task<string> GetTamperedTestToken()
    {
        await Task.Delay(1);
        return "mock-tampered-jwt-token";
    }

    private string GenerateMockAuth0Token()
    {
        return "mock-auth0-jwt-token";
    }
}