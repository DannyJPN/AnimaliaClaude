using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.Rearings.Endpoints;

public static class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
    string code,
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

    var item = await dbContext.Rearings.FindAsync(code);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.Code = viewModel.Code;
    item.DisplayName = viewModel.DisplayName!;
    item.Sort = viewModel.Sort;
    item.Note = viewModel.Note!;

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
