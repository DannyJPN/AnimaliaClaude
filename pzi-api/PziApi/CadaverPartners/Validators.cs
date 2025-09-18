using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.CadaverPartners;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.Update>
  {
    public UpdateValidator()
    {
      // Required fields validation
      RuleFor(x => x.Keyword)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Keyword is required")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Keyword cannot exceed 255 characters");

      // Optional fields with length constraints
      RuleFor(x => x.Name)
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Name cannot exceed 255 characters")
        .When(x => x.Name != null);

      RuleFor(x => x.City)
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("City cannot exceed 255 characters")
        .When(x => x.City != null);

      RuleFor(x => x.StreetAndNumber)
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("StreetAndNumber cannot exceed 255 characters")
        .When(x => x.StreetAndNumber != null);

      RuleFor(x => x.PostalCode)
        .MaximumLength(50).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("PostalCode cannot exceed 50 characters")
        .When(x => x.PostalCode != null);

      RuleFor(x => x.Country)
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Country cannot exceed 255 characters")
        .When(x => x.Country != null);

      RuleFor(x => x.Phone)
        .MaximumLength(50).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Phone cannot exceed 50 characters")
        .When(x => x.Phone != null);

      RuleFor(x => x.Email)
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Email cannot exceed 255 characters")
        .When(x => x.Email != null)
        .EmailAddress().WithErrorCode(ErrorCodes.ERR_INVALID_FORMAT)
        .WithMessage("Email must be a valid email address")
        .When(x => !string.IsNullOrEmpty(x.Email));

      RuleFor(x => x.LastName)
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("LastName cannot exceed 255 characters")
        .When(x => x.LastName != null);

      RuleFor(x => x.FirstName)
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("FirstName cannot exceed 255 characters")
        .When(x => x.FirstName != null);

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
