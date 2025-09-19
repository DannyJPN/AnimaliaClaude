using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using Testcontainers.PostgreSql;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Tenant;

namespace PziApi.Tests;

public abstract class TestBase : IAsyncLifetime
{
    protected readonly WebApplicationFactory<Program> Factory;
    protected readonly HttpClient Client;
    protected readonly PostgreSqlContainer PostgresContainer;

    protected TestBase()
    {
        PostgresContainer = new PostgreSqlBuilder()
            .WithDatabase("pzi_test")
            .WithUsername("postgres")
            .WithPassword("test_password")
            .WithCleanUp(true)
            .Build();

        Factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove the app's DbContext registration
                    var descriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(DbContextOptions<PziDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Remove tenant context for testing
                    var tenantDescriptor = services.SingleOrDefault(
                        d => d.ServiceType == typeof(ITenantContext));
                    if (tenantDescriptor != null)
                        services.Remove(tenantDescriptor);

                    // Add test tenant context
                    services.AddScoped<ITenantContext, TestTenantContext>();

                    // Add DbContext using test database
                    services.AddDbContext<PziDbContext>(options =>
                    {
                        options.UseNpgsql(PostgresContainer.GetConnectionString());
                    });
                });
            });

        Client = Factory.CreateClient();
    }

    public virtual async Task InitializeAsync()
    {
        await PostgresContainer.StartAsync();

        using var scope = Factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<PziDbContext>();
        await context.Database.EnsureCreatedAsync();
    }

    public virtual async Task DisposeAsync()
    {
        await PostgresContainer.DisposeAsync();
        Factory.Dispose();
        Client.Dispose();
    }
}

/// <summary>
/// Test implementation of tenant context for testing multi-tenant scenarios
/// </summary>
public class TestTenantContext : ITenantContext
{
    public string CurrentTenantId { get; set; } = "test-tenant";
    public string? CurrentUserId { get; set; } = "test-user";
    public bool IsInitialized { get; set; } = true;

    public void SetTenant(string tenantId, string? userId = null)
    {
        CurrentTenantId = tenantId;
        CurrentUserId = userId;
        IsInitialized = true;
    }
}