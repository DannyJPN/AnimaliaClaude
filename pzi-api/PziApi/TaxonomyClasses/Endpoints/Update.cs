using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.TaxonomyClasses.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.TaxonomyClass>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.TaxonomyClassUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.TaxonomyClassUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.TaxonomyClasses.FirstOrDefaultAsync(ac => ac.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.TaxonomyPhylumId = viewModel.TaxonomyPhylumId;
    item.Code = viewModel.Code;
    item.NameCz = viewModel.NameCz;
    item.NameLat = viewModel.NameLat;
    item.NameEn = viewModel.NameEn;
    item.NameSk = viewModel.NameSk;
    item.Cryptogram = viewModel.Cryptogram;
    item.Note = viewModel.Note;
    item.Synonyms = viewModel.Synonyms;
    item.Shortcut = viewModel.Shortcut;
    item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
    item.ModifiedBy = viewModel.ModifiedBy;

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
