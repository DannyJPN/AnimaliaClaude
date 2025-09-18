using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.TaxonomyOrders;

public class Validators
{
  public class TaxonomyOrderUpdateValidator : AbstractValidator<Dtos.TaxonomyOrderUpdate>
  {
    public TaxonomyOrderUpdateValidator()
    {
      RuleFor(ac => ac.TaxonomyClassId).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.Code).MaximumLength(2).WithErrorCode(ErrorCodes.ERR_TOO_LONG);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }

  public class TaxonomyOrderMoveValidator : AbstractValidator<Dtos.TaxonomyOrderMoveRequest>
  {
    public TaxonomyOrderMoveValidator()
    {
      RuleFor(x => x.Ids)
          .NotEmpty()
          .WithErrorCode(ErrorCodes.ERR_EMPTY)
          .WithMessage("At least one order ID is required")
          .Must(ids => ids != null && ids.Length > 0)
          .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
          .WithMessage("At least one order ID is required");

      RuleFor(x => x.TargetId)
          .GreaterThan(0)
          .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
          .WithMessage("Target class ID must be greater than 0");

      RuleFor(x => x.ModifiedBy)
          .NotEmpty()
          .WithErrorCode(ErrorCodes.ERR_EMPTY)
          .WithMessage("ModifiedBy is required");
    }
  }
}
