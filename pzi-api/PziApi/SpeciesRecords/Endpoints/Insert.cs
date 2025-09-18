using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.SpeciesRecords.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.RecordSpecies>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.RecordSpeciesUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = new Models.RecordSpecies
    {
      SpeciesId = viewModel.SpeciesId,
      Date = viewModel.Date,
      ActionTypeCode = viewModel.ActionTypeCode,
      Note = viewModel.Note,
      ModifiedBy = viewModel.ModifiedBy,
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
    };

    dbContext.RecordSpecies.Add(item);

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
