using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using DotNet.Testcontainers.Builders;
using DotNet.Testcontainers.Containers;
using Testcontainers.PostgreSql;

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
                        d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                    if (descriptor != null)
                        services.Remove(descriptor);

                    // Add DbContext using test database
                    services.AddDbContext<ApplicationDbContext>(options =>
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
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await context.Database.EnsureCreatedAsync();
    }

    public virtual async Task DisposeAsync()
    {
        await PostgresContainer.DisposeAsync();
        Factory.Dispose();
        Client.Dispose();
    }
}

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    // Add DbSets here when they exist in the actual application
}