using FluentValidation;
using PziApi.CrossCutting;
using PziApi.TaxonomyGenera.Endpoints;

namespace PziApi.TaxonomyGenera;

public class Validators
{
  public class TaxonomyGenusUpdateValidator : AbstractValidator<Dtos.TaxonomyGenusUpdate>
  {
    public TaxonomyGenusUpdateValidator()
    {
      RuleFor(ac => ac.TaxonomyFamilyId).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.Code).MaximumLength(3).WithErrorCode(ErrorCodes.ERR_TOO_LONG);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }

  public class TaxonomyGenusMoveValidator : AbstractValidator<TaxonomyGenusMoveRequest>
  {
    public TaxonomyGenusMoveValidator()
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
