using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.ExpositionSets.Endpoints;

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

    var existingSet = await context.ExpositionSets.FirstOrDefaultAsync(x => x.Id == id);
    if (existingSet == null)
    {
      return TypedResults.NotFound();
    }

    existingSet.ExpositionAreaId = viewModel.ExpositionAreaId;
    existingSet.Name = viewModel.Name;
    existingSet.Note = viewModel.Note;
    existingSet.ModifiedBy = viewModel.ModifiedBy;
    existingSet.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(existingSet.Id),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
