using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.SpecimensMarkings;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.ItemUpdate>
  {
    public UpdateValidator()
    {
      RuleFor(ac => ac.SpecimenId).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.MarkingTypeCode).NotNull().NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.RingNumber).NotNull().NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.MarkingDate).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }
}
