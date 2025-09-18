using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.SpecimenImages;

public class Validators
{
  public class InsertValidator : AbstractValidator<Dtos.ItemUpdate>
  {
    public InsertValidator()
    {
      RuleFor(x => x.SpecimenId)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("SpecimenId is required");

      RuleFor(x => x.Label).NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(x => x.Image).NotNull()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(x => x.ContentType).NotNull().NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }

  public class UpdateValidator : AbstractValidator<Dtos.ItemUpdate>
  {
    public UpdateValidator()
    {
      RuleFor(x => x.SpecimenId)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("SpecimenId is required");

      RuleFor(x => x.Label).NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }
}
