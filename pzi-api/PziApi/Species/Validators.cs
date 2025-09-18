using FluentValidation;
using PziApi.CrossCutting;
using PziApi.Species.Endpoints;

namespace PziApi.Species;

public class Validators
{
  public class SpeciesUpdateValidator : AbstractValidator<Dtos.SpeciesUpdate>
  {
    public SpeciesUpdateValidator()
    {
      RuleFor(ac => ac.TaxonomyGenusId).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ClassificationTypeCode).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.Code).MaximumLength(6).WithErrorCode(ErrorCodes.ERR_TOO_LONG);
    }
  }

  public class SpeciesMoveValidator : AbstractValidator<SpeciesMoveRequest>
  {
    public SpeciesMoveValidator()
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

  public class MassSpecimenRecordsRequestValidator : AbstractValidator<Dtos.MassSpecimenRecordsRequest>
  {
    public MassSpecimenRecordsRequestValidator()
    {
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ActionTypeCode).NotNull().NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.Date)
        .NotNull()
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }
}
