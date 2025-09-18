using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.ExpositionAreas.Endpoints;

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

    var existingArea = await context.ExpositionAreas.FirstOrDefaultAsync(x => x.Id == id);
    if (existingArea == null)
    {
      return TypedResults.NotFound();
    }

    existingArea.Name = viewModel.Name;
    existingArea.Note = viewModel.Note;
    existingArea.ModifiedBy = viewModel.ModifiedBy;
    existingArea.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(existingArea.Id),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
