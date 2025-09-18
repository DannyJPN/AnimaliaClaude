using FluentValidation;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.ExpositionAreas;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.Update>
  {
    public UpdateValidator(PziDbContext dbContext)
    {
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
}
