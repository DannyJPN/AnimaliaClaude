using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.SpecimensDocuments.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.ItemUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.DocumentSpecimens.FirstOrDefaultAsync(ac => ac.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.SpecimenId = viewModel.SpecimenId;
    item.DocumentTypeCode = viewModel.DocumentTypeCode;
    item.Date = viewModel.Date;
    item.Number = viewModel.Number;
    item.Partner = viewModel.Partner;
    item.Note = viewModel.Note;
    item.IsValid = viewModel.IsValid;
    item.ModifiedBy = viewModel.ModifiedBy;
    item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(
          item.Id,
          item.SpecimenId
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
