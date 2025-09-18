using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.SpecimenPlacements.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(
    int id,
    PziDbContext dbContext)
  {
    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var specimenPlacement = await dbContext.SpecimenPlacements
                          .FirstOrDefaultAsync(m => m.Id == id);

      if (specimenPlacement == null)
      {
        return TypedResults.NotFound();
      }

      // Store the SpecimenId before removing the placement
      int specimenId = specimenPlacement.SpecimenId;

      dbContext.SpecimenPlacements.Remove(specimenPlacement);

      // Get the specimen that needs to be updated
      var specimen = await dbContext.Specimens
              .FirstAsync(s => s.Id == specimenId);

      if (specimen.QuantityInZoo > 0)
      {
        // Get other placements for the same specimen
        var otherPlacements = await dbContext.SpecimenPlacements
                .Include(op => op.Location)
                .Where(p => p.SpecimenId == specimenId
                  && p.Id != id)
                .ToArrayAsync();

        var lastPlacement = otherPlacements.OrderBy(p => p.ValidSince).LastOrDefault();

        if (lastPlacement != null)
        {
          var orgLevelId = lastPlacement.Location != null
            ? lastPlacement.Location.OrganizationLevelId
            : lastPlacement.OrganizationLevelId;

          specimen.PlacementDate = lastPlacement.ValidSince;
          specimen.PlacementLocationId = lastPlacement.LocationId;
          specimen.OrganizationLevelId = orgLevelId;
        }
        else
        {
          specimen.PlacementDate = null;
          specimen.PlacementLocationId = null;
          specimen.OrganizationLevelId = null;
        }
      }
      else
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
