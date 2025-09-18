using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;
using PziApi.Models;

namespace PziApi.TaxonomyGenera.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.TaxonomyGenus>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.TaxonomyGenusUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.TaxonomyGenusUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = new TaxonomyGenus
    {
      TaxonomyFamilyId = viewModel.TaxonomyFamilyId!.Value,
      Code = viewModel.Code,
      NameCz = viewModel.NameCz,
      NameLat = viewModel.NameLat,
      NameEn = viewModel.NameEn,
      NameSk = viewModel.NameSk,
      // Note = viewModel.Note,
      // Synonyms = viewModel.Synonyms,
      SourceType = 'N',
      ZooStatus = "N",
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt(),
      ModifiedBy = viewModel.ModifiedBy
    };

    dbContext.TaxonomyGenera.Add(item);

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
