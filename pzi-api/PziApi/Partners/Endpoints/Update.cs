using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.Partners.Endpoints;

public static class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
    int id,
    Dtos.Update viewModel,
    PziDbContext dbContext)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.Partners.FindAsync(id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.Keyword = viewModel.Keyword;
    item.Name = viewModel.Name;
    item.Status = viewModel.Status;
    item.City = viewModel.City;
    item.StreetAddress = viewModel.StreetAddress;
    item.PostalCode = viewModel.PostalCode;
    item.Country = viewModel.Country;
    item.Phone = viewModel.Phone;
    item.Email = viewModel.Email;
    item.PartnerType = viewModel.PartnerType;
    item.LastName = viewModel.LastName;
    item.FirstName = viewModel.FirstName;
    item.Note = viewModel.Note;

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        new Dtos.Item(
          item.Id
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
