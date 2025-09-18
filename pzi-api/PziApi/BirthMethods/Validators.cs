using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.BirthMethods;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.Update>
  {
    public UpdateValidator()
    {
      RuleFor(x => x.Code)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Code is required")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Code cannot exceed 255 characters");

      RuleFor(x => x.DisplayName)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("DisplayName is required")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("DisplayName cannot exceed 255 characters");

      RuleFor(x => x.Note)
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Note cannot exceed 255 characters")
        .When(x => x.Note != null);

      RuleFor(x => x.ModifiedBy)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required")
        .MaximumLength(64).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("ModifiedBy cannot exceed 64 characters");
    }
  }
}
