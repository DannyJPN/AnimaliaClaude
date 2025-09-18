using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.Locations.Endpoints;

public static class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      int id,
      Dtos.Update viewModel,
      PziDbContext context)
  {
    var validator = new Validators.UpdateValidator(context);
    var validationResult = await validator.ValidateAsync(viewModel);
    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var existingLocation = await context.Locations.FirstOrDefaultAsync(m => m.Id == id);
    if (existingLocation == null)
    {
      return TypedResults.NotFound();
    }

    existingLocation.OrganizationLevelId = viewModel.OrganizationLevelId;
    existingLocation.ExpositionSetId = viewModel.ExpositionSetId;
    existingLocation.Name = viewModel.Name;
    existingLocation.ObjectNumber = viewModel.ObjectNumber;
    existingLocation.RoomNumber = viewModel.RoomNumber;
    existingLocation.AvailableForVisitors = viewModel.AvailableForVisitors;
    existingLocation.LocationTypeCode = viewModel.LocationTypeCode;
    existingLocation.AreaM2 = viewModel.AreaM2;
    existingLocation.CapacityM3 = viewModel.CapacityM3;
    existingLocation.Note = viewModel.Note;
    existingLocation.ModifiedBy = viewModel.ModifiedBy;
    existingLocation.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(existingLocation.Id),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
