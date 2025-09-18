using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.Rearings.Endpoints;

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

    var item = new Models.Rearing
    {
      Code = viewModel.Code,
      DisplayName = viewModel.DisplayName!,
      Sort = viewModel.Sort,
      Note = viewModel.Note!
    };

    dbContext.Rearings.Add(item);

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(
          item.Code
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
