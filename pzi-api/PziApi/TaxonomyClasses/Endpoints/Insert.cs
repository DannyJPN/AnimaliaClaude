using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;
using PziApi.Models;

namespace PziApi.TaxonomyClasses.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.TaxonomyClass>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.TaxonomyClassUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.TaxonomyClassUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    // NOTE: Add validation for phylum and invertebrates

    var item = new TaxonomyClass
    {
      TaxonomyPhylumId = viewModel.TaxonomyPhylumId,
      Code = viewModel.Code,
      NameCz = viewModel.NameCz,
      NameLat = viewModel.NameLat,
      NameEn = viewModel.NameEn,
      NameSk = viewModel.NameSk,
      Cryptogram = viewModel.Cryptogram,
      Note = viewModel.Note,
      Synonyms = viewModel.Synonyms,
      Shortcut = viewModel.Shortcut,
      SourceType = 'N',
      ZooStatus = "N",
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt(),
      ModifiedBy = viewModel.ModifiedBy,
    };

    dbContext.TaxonomyClasses.Add(item);

    await dbContext.SaveChangesAsync();

    var warningsValidator = new Validators.TaxonomyClassUpdateWarningsValidator(dbContext);
    var warningsValidationResult = await warningsValidator.ValidateAsync(item);

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.TaxonomyClass>.FromItemAndFluentValidation(
        new Dtos.TaxonomyClass(
          item.Id,
          item.TaxonomyPhylumId,
          item.Code,
          item.NameCz,
          item.NameLat,
          item.NameEn,
          item.NameSk,
          item.Cryptogram,
          item.Note,
          item.Synonyms,
          item.Shortcut,
          item.ZooStatus
        ),
        warningsValidationResult
      )
    );
  }
}
