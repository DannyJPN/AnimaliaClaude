using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.Contracts.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.ContractUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = new Models.Contract
    {
      Number = viewModel.Number!,
      Date = viewModel.Date!,
      MovementReasonCode = viewModel.MovementReasonCode,
      ContractTypeCode = viewModel.ContractTypeCode,
      PartnerId = viewModel.PartnerId,
      Note = viewModel.Note,
      NotePrague = viewModel.NotePrague,
      NotePartner = viewModel.NotePartner,
      Year = viewModel.Year,
      ModifiedBy = viewModel.ModifiedBy,
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
    };

    dbContext.Contracts.Add(item);

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
