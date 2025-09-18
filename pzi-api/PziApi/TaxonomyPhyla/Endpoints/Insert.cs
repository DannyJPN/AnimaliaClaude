using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using PziApi.Models;

namespace PziApi.TaxonomyPhyla.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.TaxonomyPhylum>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.TaxonomyPhylumUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.TaxonomyGenusUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = new TaxonomyPhylum
    {
      Code = viewModel.Code,
      NameCz = viewModel.NameCz,
      NameLat = viewModel.NameLat,
      NameEn = viewModel.NameEn,
      NameSk = viewModel.NameSk,
      ZooStatus = "N",
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt(),
      ModifiedBy = viewModel.ModifiedBy
    };

    dbContext.TaxonomyPhyla.Add(item);

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.TaxonomyPhylum>.FromItemAndFluentValidation(
        new Dtos.TaxonomyPhylum(
          item.Id,
          item.Code,
          item.NameCz,
          item.NameLat,
          item.NameEn,
          item.NameSk,
          item.ZooStatus
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
