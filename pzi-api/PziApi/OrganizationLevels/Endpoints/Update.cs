using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.OrganizationLevels.Endpoints;

public static class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      int id,
      Dtos.Update viewModel,
      PziDbContext context)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);
    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var existingOrganizationLevel = await context.OrganizationLevels.FirstOrDefaultAsync(m => m.Id == id);
    if (existingOrganizationLevel == null)
    {
      return TypedResults.NotFound();
    }

    existingOrganizationLevel.ParentId = viewModel.ParentId;
    existingOrganizationLevel.Level = viewModel.Level;
    existingOrganizationLevel.Name = viewModel.Name;
    existingOrganizationLevel.Director = viewModel.Director;
    existingOrganizationLevel.JournalApproversGroup = viewModel.JournalApproversGroup;
    existingOrganizationLevel.JournalReadGroup = viewModel.JournalReadGroup;
    existingOrganizationLevel.JournalContributorGroup = viewModel.JournalContributorGroup;
    existingOrganizationLevel.ModifiedBy = viewModel.ModifiedBy;
    existingOrganizationLevel.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(existingOrganizationLevel.Id),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
