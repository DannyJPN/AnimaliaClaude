using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;

namespace PziApi.Partners.Endpoints;

public static class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
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

    var item = new Models.Partner
    {
      Keyword = viewModel.Keyword,
      Name = viewModel.Name,
      Status = viewModel.Status,
      City = viewModel.City,
      StreetAddress = viewModel.StreetAddress,
      PostalCode = viewModel.PostalCode,
      Country = viewModel.Country,
      Phone = viewModel.Phone,
      Email = viewModel.Email,
      PartnerType = viewModel.PartnerType,
      LastName = viewModel.LastName,
      FirstName = viewModel.FirstName,
      Note = viewModel.Note
    };

    dbContext.Partners.Add(item);

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
