using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.Contracts;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.ContractUpdate>
  {
    public UpdateValidator()
    {
      RuleFor(ac => ac.Number)
        .NotNull().NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(ac => ac.Date)
        .NotNull().NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(ac => ac.Year)
        .NotNull()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(ac => ac.MovementReasonCode)
        .NotNull().NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(ac => ac.ContractTypeCode)
        .NotNull().NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }
}
