using FluentValidation;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.ExpositionSets;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.Update>
  {
    public UpdateValidator(PziDbContext dbContext)
    {
      RuleFor(x => x.ExpositionAreaId)
        .GreaterThan(0).WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("ExpositionAreaId must be greater than 0");

      RuleFor(x => x.Name)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Name is required")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Name cannot exceed 255 characters");

      RuleFor(x => x.Note)
        .MaximumLength(1000).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Note cannot exceed 1000 characters")
        .When(x => x.Note != null);

      RuleFor(x => x.ModifiedBy)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required")
        .MaximumLength(64).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("ModifiedBy cannot exceed 64 characters");
    }
  }

  public class ExpositionSetMoveValidator : AbstractValidator<Dtos.ExpositionSetMoveRequest>
  {
    public ExpositionSetMoveValidator()
    {
      RuleFor(x => x.Ids)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("At least one ExpositionSet ID is required");

      RuleFor(x => x.TargetId)
        .GreaterThan(0)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("Target ExpositionArea ID must be greater than 0");

      RuleFor(x => x.ModifiedBy)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required");
    }
  }
}
