using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.SpeciesRecords.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.RecordSpecies>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.RecordSpeciesUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.RecordSpecies.FirstOrDefaultAsync(ac => ac.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.SpeciesId = viewModel.SpeciesId;
    item.Date = viewModel.Date;
    item.ActionTypeCode = viewModel.ActionTypeCode;
    item.Note = viewModel.Note;
    item.ModifiedBy = viewModel.ModifiedBy;
    item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.RecordSpecies>.FromItemAndFluentValidation(
        new Dtos.RecordSpecies(
          item.Id,
          item.SpeciesId
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
