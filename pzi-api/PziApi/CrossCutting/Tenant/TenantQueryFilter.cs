using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using PziApi.Models;
using System.Linq.Expressions;
using System.Reflection;

namespace PziApi.CrossCutting.Tenant;

/// <summary>
/// EF Core interceptor that automatically applies tenant filtering to all queries
/// </summary>
public static class TenantQueryFilter
{
    public static void ApplyGlobalFilters(this ModelBuilder modelBuilder, ITenantContext tenantContext)
    {
        // Get all entity types that implement ITenantEntity
        var tenantEntityTypes = modelBuilder.Model.GetEntityTypes()
            .Where(et => typeof(ITenantEntity).IsAssignableFrom(et.ClrType))
            .ToList();

        foreach (var entityType in tenantEntityTypes)
        {
            var method = typeof(TenantQueryFilter)
                .GetMethod(nameof(SetTenantFilter), BindingFlags.NonPublic | BindingFlags.Static)?
                .MakeGenericMethod(entityType.ClrType);

            method?.Invoke(null, new object[] { modelBuilder, tenantContext });
        }
    }

    private static void SetTenantFilter<TEntity>(ModelBuilder modelBuilder, ITenantContext tenantContext)
        where TEntity : class, ITenantEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(CreateTenantFilter<TEntity>(tenantContext));
    }

    private static Expression<Func<TEntity, bool>> CreateTenantFilter<TEntity>(ITenantContext tenantContext)
        where TEntity : class, ITenantEntity
    {
        return entity => !tenantContext.HasTenant() || entity.TenantId == tenantContext.TenantId;
    }
}

/// <summary>
/// EF Core save changes interceptor that automatically sets tenant ID on new entities
/// </summary>
public class TenantSaveChangesInterceptor : Microsoft.EntityFrameworkCore.Diagnostics.SaveChangesInterceptor
{
    private readonly ITenantContext _tenantContext;

    public TenantSaveChangesInterceptor(ITenantContext tenantContext)
    {
        _tenantContext = tenantContext;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        SetTenantId(eventData.Context!);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        SetTenantId(eventData.Context!);
        return base.SavingChanges(eventData, result);
    }

    private void SetTenantId(DbContext context)
    {
        if (!_tenantContext.HasTenant())
            return;

        var addedEntries = context.ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added && e.Entity is ITenantEntity)
            .ToList();

        foreach (var entry in addedEntries)
        {
            if (entry.Entity is ITenantEntity tenantEntity && tenantEntity.TenantId == 0)
            {
                tenantEntity.TenantId = _tenantContext.TenantId!.Value;
            }
        }

        // Validate that all entities belong to the current tenant
        var modifiedEntries = context.ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Modified && e.Entity is ITenantEntity)
            .ToList();

        foreach (var entry in modifiedEntries)
        {
            if (entry.Entity is ITenantEntity tenantEntity && tenantEntity.TenantId != _tenantContext.TenantId)
            {
                throw new InvalidOperationException(
                    $"Cannot modify entity from tenant {tenantEntity.TenantId} while in tenant {_tenantContext.TenantId} context");
            }
        }
    }
}