using FluentValidation;
using PziApi.CrossCutting;
using PziApi.TaxonomyFamilies.Endpoints;

namespace PziApi.TaxonomyFamilies;

public class Validators
{
  public class TaxonomyFamilyUpdateValidator : AbstractValidator<Dtos.TaxonomyFamilyUpdate>
  {
    public TaxonomyFamilyUpdateValidator()
    {
      RuleFor(ac => ac.TaxonomyOrderId).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.Code).MaximumLength(3).WithErrorCode(ErrorCodes.ERR_TOO_LONG);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }

  public class TaxonomyFamilyMoveValidator : AbstractValidator<TaxonomyFamilyMoveRequest>
  {
    public TaxonomyFamilyMoveValidator()
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
