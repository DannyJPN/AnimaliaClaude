using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;
using PziApi.Models;

namespace PziApi.TaxonomyOrders.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.TaxonomyOrder>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.TaxonomyOrderUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.TaxonomyOrderUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = new TaxonomyOrder
    {
      TaxonomyClassId = viewModel.TaxonomyClassId!.Value,
      Code = viewModel.Code,
      NameCz = viewModel.NameCz,
      NameLat = viewModel.NameLat,
      NameEn = viewModel.NameEn,
      NameSk = viewModel.NameSk,
      Note = viewModel.Note,
      Synonyms = viewModel.Synonyms,
      ModifiedBy = viewModel.ModifiedBy,
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt(),
      SourceType = 'N',
      ZooStatus = "N"
    };

    dbContext.TaxonomyOrders.Add(item);

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.TaxonomyOrder>.FromItemAndFluentValidation(
        new Dtos.TaxonomyOrder(
          item.Id,
          item.TaxonomyClassId,
          item.Code,
          item.NameCz,
          item.NameLat,
          item.NameEn,
          item.NameSk,
          item.Note,
          item.Synonyms,
          item.ZooStatus
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
