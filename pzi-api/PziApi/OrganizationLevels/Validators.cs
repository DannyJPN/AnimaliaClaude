using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.OrganizationLevels;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.Update>
  {
    public UpdateValidator()
    {
      // Required fields validation
      RuleFor(x => x.Level)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Level is required")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Level cannot exceed 255 characters");

      RuleFor(x => x.Name)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Name is required")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Name cannot exceed 255 characters");

      RuleFor(x => x.Director)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Director is required for departments")
        .When(x => x.Level == "department")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Director cannot exceed 255 characters")
        .When(x => x.Director != null);

      RuleFor(x => x.ModifiedBy)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required")
        .MaximumLength(64).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("ModifiedBy cannot exceed 64 characters");
    }
  }

  public class OrganizationsClassMoveValidator : AbstractValidator<Dtos.OrganizationsLevelMoveRequest>
  {
    public OrganizationsClassMoveValidator()
    {
      RuleFor(x => x.Ids)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("At least one class ID is required")
        .Must(ids => ids != null && ids.Length > 0)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("At least one class ID is required");

      RuleFor(x => x.TargetId)
        .GreaterThan(0)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("Target organization ID must be greater than 0");

      RuleFor(x => x.ModifiedBy)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required");
    }
  }
}
