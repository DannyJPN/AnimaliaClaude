using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.OrganizationLevels.Endpoints;

public static class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
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

    var organizationLevel = new Models.OrganizationLevel
    {
      ParentId = viewModel.ParentId,
      Level = viewModel.Level,
      Name = viewModel.Name,
      Director = viewModel.Director,
      JournalApproversGroup = viewModel.JournalApproversGroup,
      JournalReadGroup = viewModel.JournalReadGroup,
      JournalContributorGroup = viewModel.JournalContributorGroup,
      ModifiedBy = viewModel.ModifiedBy,
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
    };

    context.OrganizationLevels.Add(organizationLevel);

    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(organizationLevel.Id),
        new ValidationResult()
      )
    );
  }
}
