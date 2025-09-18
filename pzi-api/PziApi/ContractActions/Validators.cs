using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.ContractActions;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.ContractActionUpdate>
  {
    public UpdateValidator()
    {
      RuleFor(ac => ac.ContractId)
        .NotNull().NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(ac => ac.ModifiedBy)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }
}
