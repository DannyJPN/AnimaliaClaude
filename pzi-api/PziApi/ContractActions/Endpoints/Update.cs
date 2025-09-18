using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.ContractActions.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.ContractActionUpdate viewModel, PziDbContext dbContext)
    {
      var validator = new Validators.UpdateValidator();
      var validationResult = validator.Validate(viewModel);

      if (!validationResult.IsValid)
      {
        var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

        return TypedResults.BadRequest(validationErrors);
      }

      var item = await dbContext.ContractActions.FirstOrDefaultAsync(ac => ac.Id == id);
      if (item == null)
      {
        return TypedResults.NotFound();
      }

      item.ActionInitiatorCode = viewModel.ActionInitiatorCode;
      item.ActionTypeCode = viewModel.ActionTypeCode;
      item.ContractId = viewModel.ContractId;
      item.Date = viewModel.Date;
      item.Note = viewModel.Note;
      item.ModifiedBy = viewModel.ModifiedBy;
      item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

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
