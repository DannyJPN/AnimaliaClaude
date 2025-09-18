using FluentValidation;
using PziApi.CrossCutting;
using PziApi.Specimens.Endpoints;

namespace PziApi.Specimens;

public class Validators
{
  public class SpecimenUpdateValidator : AbstractValidator<Dtos.SpecimenUpdate>
  {
    public SpecimenUpdateValidator()
    {
      RuleFor(ac => ac.SpeciesId).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.AccessionNumber).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ClassificationTypeCode).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.GenderTypeCode).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }

  public class SpecimenMoveValidator : AbstractValidator<SpecimenMoveRequest>
  {
    public SpecimenMoveValidator()
    {
      RuleFor(x => x.Ids)
        .NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .Must(ids => ids != null && ids.Length > 0).WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Ids cannot be empty");

      RuleFor(x => x.TargetId)
        .NotEqual(0).WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("TargetId cannot be empty");

      RuleFor(x => x.ModifiedBy)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy cannot be empty");
    }
  }
}
