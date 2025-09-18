using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;

namespace PziApi.Movements;

public class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(int id, PziDbContext dbContext)
  {
    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var item = await dbContext.Movements.FirstOrDefaultAsync(m => m.Id == id);

      if (item == null)
      {
        return TypedResults.NotFound();
      }

      var specimen = await dbContext.Specimens
            .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .FirstAsync(s => s.Id == item.SpecimenId);

      var otherMovements = await dbContext.Movements
            .Where(m => m.SpecimenId == specimen.Id && m.Id != item.Id)
            .ToArrayAsync();

      var (
        speciesCounts,
        genusCounts,
        familyCounts,
        orderCounts,
        classCounts,
        phylumCounts
      ) = await QuantityCalculations.GetDataForCalculations(dbContext, specimen);

      dbContext.Movements.Remove(item);

      QuantityCalculations.UpdateTaxonomyValues(
        specimen,
        otherMovements,
        speciesCounts,
        genusCounts,
        familyCounts,
        orderCounts,
        classCounts,
        phylumCounts
      );

      if (specimen.QuantityInZoo == 0)
      {
        specimen.PlacementDate = null;
        specimen.PlacementLocationId = null;
        specimen.OrganizationLevelId = null;
      }

      await dbContext.SaveChangesAsync();

      await tx.CommitAsync();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
