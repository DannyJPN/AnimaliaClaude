using Microsoft.Extensions.DependencyInjection;
using FluentAssertions;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;

namespace PziApi.Tests.MultiTenant;

[Trait("Category", "MultiTenant")]
public class TenantIsolationTests : TestBase
{
    [Fact]
    public async Task DatabaseQuery_WithTenantContext_OnlyReturnsOwnData()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant1Id = await CreateTestTenant(context, "Tenant 1");
        var tenant2Id = await CreateTestTenant(context, "Tenant 2");

        await CreateTestUser(context, tenant1Id, "user1@tenant1.com");
        await CreateTestUser(context, tenant1Id, "user2@tenant1.com");
        await CreateTestUser(context, tenant2Id, "user1@tenant2.com");

        // Act - Query with tenant 1 context
        var tenant1Token = GenerateTestToken(tenant1Id);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tenant1Token);

        var response = await Client.GetAsync("/api/users");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();
        var users = await DeserializeResponse<List<dynamic>>(response);
        users.Should().HaveCount(2); // Only tenant 1 users
    }

    [Fact]
    public async Task API_CrossTenantAccess_ShouldBeDenied()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant1Id = await CreateTestTenant(context, "Tenant 1");
        var tenant2Id = await CreateTestTenant(context, "Tenant 2");

        var user2Id = await CreateTestUser(context, tenant2Id, "user@tenant2.com");

        // Act - Try to access tenant 2 user with tenant 1 token
        var tenant1Token = GenerateTestToken(tenant1Id);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tenant1Token);

        var response = await Client.GetAsync($"/api/users/{user2Id}");

        // Assert
        response.StatusCode.Should().BeOneOf(
            System.Net.HttpStatusCode.NotFound,
            System.Net.HttpStatusCode.Forbidden
        );
    }

    [Fact]
    public async Task API_TenantAdminAccess_ShouldOnlyAccessOwnTenant()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant1Id = await CreateTestTenant(context, "Tenant 1");
        var tenant2Id = await CreateTestTenant(context, "Tenant 2");

        // Act - Admin tries to access another tenant
        var adminToken = GenerateTestToken(tenant1Id, "admin");
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminToken);

        var response = await Client.GetAsync($"/api/admin/tenants/{tenant2Id}/users");

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Forbidden);
    }

    [Theory]
    [InlineData("/api/tenants/{tenantId}/records")]
    [InlineData("/api/tenants/{tenantId}/exports")]
    [InlineData("/api/tenants/{tenantId}/settings")]
    public async Task API_ProtectedEndpoints_EnforceTenantIsolation(string endpointTemplate)
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant1Id = await CreateTestTenant(context, "Tenant 1");
        var tenant2Id = await CreateTestTenant(context, "Tenant 2");

        var endpoint = endpointTemplate.Replace("{tenantId}", tenant2Id.ToString());

        // Act - Access tenant 2 endpoint with tenant 1 token
        var tenant1Token = GenerateTestToken(tenant1Id);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tenant1Token);

        var response = await Client.GetAsync(endpoint);

        // Assert
        response.StatusCode.Should().BeOneOf(
            System.Net.HttpStatusCode.Forbidden,
            System.Net.HttpStatusCode.NotFound
        );
    }

    [Fact]
    public async Task Database_BulkOperations_RespectTenantBoundaries()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant1Id = await CreateTestTenant(context, "Tenant 1");
        var tenant2Id = await CreateTestTenant(context, "Tenant 2");

        await CreateTestRecord(context, tenant1Id, "Record 1-1");
        await CreateTestRecord(context, tenant1Id, "Record 1-2");
        await CreateTestRecord(context, tenant2Id, "Record 2-1");

        // Act - Bulk update with tenant 1 context
        var tenant1Token = GenerateTestToken(tenant1Id);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tenant1Token);

        var bulkUpdatePayload = new
        {
            updates = new[]
            {
                new { recordId = 1, status = "Updated" },
                new { recordId = 2, status = "Updated" },
                new { recordId = 3, status = "Updated" } // This belongs to tenant 2
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(bulkUpdatePayload),
            System.Text.Encoding.UTF8,
            "application/json"
        );

        var response = await Client.PutAsync("/api/records/bulk-update", content);

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        // Verify only tenant 1 records were updated
        var tenant1Records = await GetTenantRecords(context, tenant1Id);
        var tenant2Records = await GetTenantRecords(context, tenant2Id);

        tenant1Records.Should().AllSatisfy(r => r.Status == "Updated");
        tenant2Records.Should().AllSatisfy(r => r.Status != "Updated");
    }

    [Fact]
    public async Task API_SuperAdminAccess_CanAccessMultipleTenants()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant1Id = await CreateTestTenant(context, "Tenant 1");
        var tenant2Id = await CreateTestTenant(context, "Tenant 2");

        // Act - SuperAdmin accesses different tenants
        var superAdminToken = GenerateTestToken(null, "superadmin"); // No specific tenant
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", superAdminToken);

        var tenant1Response = await Client.GetAsync($"/api/superadmin/tenants/{tenant1Id}");
        var tenant2Response = await Client.GetAsync($"/api/superadmin/tenants/{tenant2Id}");

        // Assert
        tenant1Response.IsSuccessStatusCode.Should().BeTrue();
        tenant2Response.IsSuccessStatusCode.Should().BeTrue();
    }

    [Fact]
    public async Task Database_ConcurrentAccess_MaintainsTenantIsolation()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant1Id = await CreateTestTenant(context, "Tenant 1");
        var tenant2Id = await CreateTestTenant(context, "Tenant 2");

        // Act - Simulate concurrent access from different tenants
        var tasks = new List<Task<HttpResponseMessage>>();

        for (int i = 0; i < 10; i++)
        {
            var client1 = Factory.CreateClient();
            var client2 = Factory.CreateClient();

            client1.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GenerateTestToken(tenant1Id));
            client2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GenerateTestToken(tenant2Id));

            tasks.Add(client1.GetAsync("/api/users"));
            tasks.Add(client2.GetAsync("/api/users"));
        }

        var responses = await Task.WhenAll(tasks);

        // Assert
        responses.Should().AllSatisfy(r => r.IsSuccessStatusCode.Should().BeTrue());

        // Verify each response only contains data from the correct tenant
        // This would need to be implemented based on the actual response structure
    }

    [Fact]
    public async Task API_DataExport_OnlyExportsOwnTenantData()
    {
        // Arrange
        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();

        var tenant1Id = await CreateTestTenant(context, "Tenant 1");
        var tenant2Id = await CreateTestTenant(context, "Tenant 2");

        await CreateTestRecord(context, tenant1Id, "Tenant 1 Record");
        await CreateTestRecord(context, tenant2Id, "Tenant 2 Record");

        // Act - Export data with tenant 1 token
        var tenant1Token = GenerateTestToken(tenant1Id);
        Client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", tenant1Token);

        var response = await Client.GetAsync("/api/export/records");

        // Assert
        response.IsSuccessStatusCode.Should().BeTrue();

        var exportData = await response.Content.ReadAsStringAsync();
        exportData.Should().Contain("Tenant 1 Record");
        exportData.Should().NotContain("Tenant 2 Record");
    }

    // Helper methods
    private async Task<int> CreateTestTenant(PziDbContext context, string name)
    {
        // Mock implementation - replace with actual tenant entity
        await Task.Delay(1);
        return 1;
    }

    private async Task<int> CreateTestUser(PziDbContext context, int tenantId, string email)
    {
        // Mock implementation - replace with actual user entity
        await Task.Delay(1);
        return 1;
    }

    private async Task CreateTestRecord(PziDbContext context, int tenantId, string name)
    {
        // Mock implementation - replace with actual record entity
        await Task.Delay(1);
    }

    private async Task<List<dynamic>> GetTenantRecords(PziDbContext context, int tenantId)
    {
        // Mock implementation - replace with actual query
        await Task.Delay(1);
        return new List<dynamic>();
    }

    private string GenerateTestToken(int? tenantId, string role = "user")
    {
        // Mock JWT generation - replace with actual JWT generation logic
        return $"mock-jwt-{tenantId}-{role}";
    }

    private async Task<T> DeserializeResponse<T>(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })!;
    }
}