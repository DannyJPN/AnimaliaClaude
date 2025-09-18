using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.EntityFrameworkCore;

namespace PziApi.TaxonomyPhyla.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.TaxonomyPhylum>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.TaxonomyPhylumUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.TaxonomyGenusUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.TaxonomyPhyla.FirstOrDefaultAsync(ac => ac.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.Code = viewModel.Code;
    item.NameCz = viewModel.NameCz;
    item.NameLat = viewModel.NameLat;
    item.NameEn = viewModel.NameEn;
    item.NameSk = viewModel.NameSk;
    item.ModifiedBy = viewModel.ModifiedBy;
    item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

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

