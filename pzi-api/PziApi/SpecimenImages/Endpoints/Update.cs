using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.SpecimenImages.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.ItemIdResult>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.ItemUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.SpecimenImages.FirstOrDefaultAsync(si => si.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.SpecimenId = viewModel.SpecimenId;
    item.Label = viewModel.Label;
    item.Description = viewModel.Description;

    // Only update Image if it's not null
    if (viewModel.Image != null && viewModel.ContentType != null)
    {
      item.Image = viewModel.Image;
      item.ContentType = viewModel.ContentType;
    }

    item.ModifiedBy = viewModel.ModifiedBy;
    item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.ItemIdResult>.FromItemAndFluentValidation(
        new Dtos.ItemIdResult(
          item.Id
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
