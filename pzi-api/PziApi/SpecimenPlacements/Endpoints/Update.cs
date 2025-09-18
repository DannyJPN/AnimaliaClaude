using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.SpecimenPlacements.Endpoints;

public static class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
    int id,
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
      var item = await dbContext.SpecimenPlacements
                  .Include(p => p.Location)
                  .Include(p => p.OrganizationLevel)
                  .FirstOrDefaultAsync(p => p.Id == id);

      if (item == null)
      {
        return TypedResults.NotFound();
      }

      var newLocation = viewModel.LocationId != item.LocationId
        ? await dbContext.Locations.FirstOrDefaultAsync(l => l.Id == viewModel.LocationId)
        : item.Location;

      item.SpecimenId = viewModel.SpecimenId;
      item.ValidSince = viewModel.ValidSince;
      item.LocationId = viewModel.LocationId;
      item.OrganizationLevelId = viewModel.OrganizationLevelId;
      item.Note = viewModel.Note;
      item.ModifiedBy = viewModel.ModifiedBy;
      item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
      item.Location = newLocation;

      var specimen = await dbContext.Specimens
              .FirstAsync(s => s.Id == item.SpecimenId);

      if (specimen.QuantityInZoo > 0)
      {
        var otherPlacements = await dbContext.SpecimenPlacements
                .Include(op => op.Location)
                .Where(p => p.SpecimenId == item.SpecimenId
                    && p.Id != item.Id)
                .ToListAsync();

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
