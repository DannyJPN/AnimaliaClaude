using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using FluentAssertions;
using System.Net;
using System.Text.Json;
using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;

namespace PziApi.Tests.Integration;

public class TenantsControllerIntegrationTests : TestBase
{
    [Fact]
    public async Task GetTenants_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await Client.GetAsync("/api/tenants");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetTenants_WithValidAuth_ReturnsTenants()
    {
        // Arrange
        var token = await GetValidAuthToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        await SeedTestTenant("Test Tenant 1");

        // Act
        var response = await Client.GetAsync("/api/tenants");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var content = await response.Content.ReadAsStringAsync();
        var tenants = JsonSerializer.Deserialize<List<dynamic>>(content);
        tenants.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetTenant_WithInvalidTenantId_ReturnsNotFound()
    {
        // Arrange
        var token = await GetValidAuthToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await Client.GetAsync("/api/tenants/999999");

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task CreateTenant_WithValidData_CreatesSuccessfully()
    {
        // Arrange
        var token = await GetValidAuthToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var newTenant = new
        {
            Name = "New Test Tenant",
            Domain = "newtest.example.com",
            Status = "Active"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(newTenant),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await Client.PostAsync("/api/tenants", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var responseContent = await response.Content.ReadAsStringAsync();
        var createdTenant = JsonSerializer.Deserialize<dynamic>(responseContent);
        createdTenant.Should().NotBeNull();
    }

    [Fact]
    public async Task MultiTenant_DataIsolation_PreventssCrossTenantAccess()
    {
        // Arrange
        var tenant1Id = await SeedTestTenant("Tenant 1");
        var tenant2Id = await SeedTestTenant("Tenant 2");

        await SeedTestRecord(tenant1Id, "Record for Tenant 1");
        await SeedTestRecord(tenant2Id, "Record for Tenant 2");

        // Act - Try to access tenant 2 data with tenant 1 token
        var tenant1Token = await GetValidAuthToken(tenant1Id);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tenant1Token);

        var response = await Client.GetAsync($"/api/tenants/{tenant2Id}/records");

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Forbidden, HttpStatusCode.NotFound);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task CreateTenant_WithInvalidName_ReturnsBadRequest(string? tenantName)
    {
        // Arrange
        var token = await GetValidAuthToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var newTenant = new
        {
            Name = tenantName,
            Domain = "test.example.com",
            Status = "Active"
        };

        var content = new StringContent(
            JsonSerializer.Serialize(newTenant),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        // Act
        var response = await Client.PostAsync("/api/tenants", content);

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DeleteTenant_WithExistingData_HandlesGracefully()
    {
        // Arrange
        var token = await GetValidAuthToken();
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var tenantId = await SeedTestTenant("Tenant to Delete");
        await SeedTestRecord(tenantId, "Record that should be handled during deletion");

        // Act
        var response = await Client.DeleteAsync($"/api/tenants/{tenantId}");

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.OK, HttpStatusCode.NoContent, HttpStatusCode.Conflict);
    }

    private async Task<string> GetValidAuthToken(int? tenantId = null)
    {
        // Mock JWT token generation for testing
        // In real implementation, this would integrate with Auth0 or generate proper JWT
        await Task.Delay(1);
        return "mock-jwt-token-for-testing";
    }

    private async Task<int> SeedTestTenant(string name)
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Add tenant to database
        // This is a placeholder - implement based on actual tenant model
        var tenant = new { Name = name, CreatedAt = DateTime.UtcNow };

        // Mock implementation - replace with actual entity
        await context.SaveChangesAsync();

        return 1; // Return mock ID
    }

    private async Task SeedTestRecord(int tenantId, string recordName)
    {
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        // Add record associated with tenant
        // This is a placeholder - implement based on actual models
        await Task.Delay(1);
    }
}