using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.TaxonomyGenera.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.TaxonomyGenus>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.TaxonomyGenusUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.TaxonomyGenusUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.TaxonomyGenera.FirstOrDefaultAsync(ac => ac.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.TaxonomyFamilyId = viewModel.TaxonomyFamilyId!.Value;
    item.Code = viewModel.Code;
    item.NameCz = viewModel.NameCz;
    item.NameLat = viewModel.NameLat;
    item.NameEn = viewModel.NameEn;
    item.NameSk = viewModel.NameSk;
    // item.Note = viewModel.Note;
    // item.Synonyms = viewModel.Synonyms;
    item.ModifiedBy = viewModel.ModifiedBy;
    item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.TaxonomyGenus>.FromItemAndFluentValidation(
        new Dtos.TaxonomyGenus(
          item.Id,
          item.TaxonomyFamilyId,
          item.Code,
          item.NameCz,
          item.NameLat,
          item.NameEn,
          item.NameSk,
          // item.Note,
          // item.Synonyms,
          item.ZooStatus
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
