using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.EntityFrameworkCore;

namespace PziApi.SpecimenPlacements.Endpoints;

public static class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      Dtos.Update viewModel,
      PziDbContext dbContext)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    Dtos.Item resultVm;

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var location = viewModel.LocationId != null
        ? await dbContext.Locations.FirstOrDefaultAsync(l => l.Id == viewModel.LocationId)
        : null;

      var item = new Models.SpecimenPlacement
      {
        SpecimenId = viewModel.SpecimenId,
        ValidSince = viewModel.ValidSince,
        LocationId = viewModel.LocationId,
        OrganizationLevelId = viewModel.OrganizationLevelId,
        Note = viewModel.Note,
        ModifiedBy = viewModel.ModifiedBy,
        ModifiedAt = DateTimeHelpers.GetLastModifiedAt(),
        Location = location
      };

      var specimen = await dbContext.Specimens
              .FirstAsync(s => s.Id == viewModel.SpecimenId);

      var otherPlacements = await dbContext.SpecimenPlacements
              .Include(op => op.Location)
              .Where(p => p.SpecimenId == item.SpecimenId)
              .ToListAsync();

      dbContext.SpecimenPlacements.Add(item);

      if (specimen.QuantityInZoo > 0)
      {
        otherPlacements.Add(item);

        var lastPlacement = otherPlacements.OrderBy(p => p.ValidSince).LastOrDefault();

        // Update the specimen with the latest placement information
        if (lastPlacement != null)
        {
          var orgLevelId = lastPlacement.Location != null
            ? lastPlacement.Location.OrganizationLevelId
            : lastPlacement.OrganizationLevelId;

          specimen.PlacementDate = lastPlacement.ValidSince;
          specimen.PlacementLocationId = lastPlacement.LocationId;
          specimen.OrganizationLevelId = orgLevelId;
        }
      }
      else
      {
        specimen.PlacementDate = null;
        specimen.PlacementLocationId = null;
        specimen.OrganizationLevelId = null;
      }

      await dbContext.SaveChangesAsync();

      resultVm = new Dtos.Item(
        item.Id
      );

      await tx.CommitAsync();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        resultVm,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
