using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.Locations.Endpoints;

public static class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
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

    var location = new Models.Location
    {
      OrganizationLevelId = viewModel.OrganizationLevelId,
      ExpositionSetId = viewModel.ExpositionSetId,
      Name = viewModel.Name,
      ObjectNumber = viewModel.ObjectNumber,
      RoomNumber = viewModel.RoomNumber,
      AvailableForVisitors = viewModel.AvailableForVisitors,
      LocationTypeCode = viewModel.LocationTypeCode,
      AreaM2 = viewModel.AreaM2,
      CapacityM3 = viewModel.CapacityM3,
      Note = viewModel.Note,
      ModifiedBy = viewModel.ModifiedBy,
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
    };

    context.Locations.Add(location);

    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(location.Id),
        new ValidationResult()
      )
    );
  }
}
