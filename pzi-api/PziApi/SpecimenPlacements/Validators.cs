using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.SpecimenPlacements;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.Update>
  {
    public UpdateValidator()
    {
      RuleFor(x => x.SpecimenId)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("SpecimenId is required");

      RuleFor(x => x.ValidSince)
        .NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ValidSince is required")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("ValidSince cannot exceed 255 characters");

      RuleFor(x => x.ModifiedBy)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required")
        .MaximumLength(64).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("ModifiedBy cannot exceed 64 characters");

      RuleFor(x => x)
        .Custom((x, context) =>
        {
          bool hasLocationId = x.LocationId.HasValue;
          bool hasOrgLevelId = x.OrganizationLevelId.HasValue;

          if (hasLocationId && hasOrgLevelId)
          {
            context.AddFailure(new FluentValidation.Results.ValidationFailure("LocationId", "Only one of LocationId or OrganizationLevelId can be provided")
            {
              ErrorCode = ErrorCodes.ERR_MUTUALLY_EXCLUSIVE
            });
            context.AddFailure(new FluentValidation.Results.ValidationFailure("OrganizationLevelId", "Only one of LocationId or OrganizationLevelId can be provided")
            {
              ErrorCode = ErrorCodes.ERR_MUTUALLY_EXCLUSIVE
            });
          }
        });
        
      RuleFor(x => x)
        .Custom((x, context) =>
        {
          bool hasLocationId = x.LocationId.HasValue;
          bool hasOrgLevelId = x.OrganizationLevelId.HasValue;

          if (!hasLocationId && !hasOrgLevelId)
          {
            context.AddFailure(new FluentValidation.Results.ValidationFailure("LocationId", "Either LocationId or OrganizationLevelId must be provided")
            {
              ErrorCode = ErrorCodes.ERR_REQUIRED_ALTERNATIVE
            });
            context.AddFailure(new FluentValidation.Results.ValidationFailure("OrganizationLevelId", "Either LocationId or OrganizationLevelId must be provided")
            {
              ErrorCode = ErrorCodes.ERR_REQUIRED_ALTERNATIVE
            });
          }
        });
    }
  }
}
