using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.SpeciesRecords;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.RecordSpeciesUpdate>
  {
    public UpdateValidator()
    {
      RuleFor(ac => ac.SpeciesId).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ActionTypeCode).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }
}
