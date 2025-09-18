using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Locations;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.Update>
  {
    public UpdateValidator(PziDbContext dbContext)
    {
      // Required fields validation
      RuleFor(x => x.Name)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Name is required")
        .MaximumLength(255).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Name cannot exceed 255 characters");

      RuleFor(x => x.ExpositionSetId)
        .NotNull()
        .GreaterThan(0)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("ExpositionSetId must be greater than 0");

      RuleFor(x => x.LocationTypeCode)
        .Must(code => code == 0 || code == 1 || code == 2)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("Location Type Code must be 0, 1, or 2");

      RuleFor(x => x.ModifiedBy)
        .NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required")
        .MaximumLength(64).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("ModifiedBy cannot exceed 64 characters");

      // Optional fields validation
      RuleFor(x => x.Note)
        .MaximumLength(1000).WithErrorCode(ErrorCodes.ERR_TOO_LONG)
        .WithMessage("Note cannot exceed 1000 characters")
        .When(x => x.Note != null);

      RuleFor(x => x.OrganizationLevelId)
        .MustAsync(async (organizationLevelId, cancellation) =>
        {
          var orgLevel = await dbContext.OrganizationLevels.FirstOrDefaultAsync(ol => ol.Id == organizationLevelId);

          if (orgLevel == null || orgLevel.Level != "district")
          {
            return false;
          }

          return true;
        })
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .When(x => x.OrganizationLevelId != null);
    }
  }

  public class LocationsMoveToOrganizationValidator : AbstractValidator<Dtos.LocationsMoveRequest>
  {
    public LocationsMoveToOrganizationValidator()
    {
      RuleFor(x => x.Ids)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("At least one Location ID is required");

      RuleFor(x => x.TargetId)
        .GreaterThan(0)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("Target District ID must be greater than 0");

      RuleFor(x => x.ModifiedBy)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required");
    }
  }

  public class LocationsMoveToExpositionValidator : AbstractValidator<Dtos.LocationsMoveRequest>
  {
    public LocationsMoveToExpositionValidator()
    {
      RuleFor(x => x.Ids)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("At least one Location ID is required");

      RuleFor(x => x.TargetId)
        .GreaterThan(0)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("Target Exposition ID must be greater than 0");

      RuleFor(x => x.ModifiedBy)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required");
    }
  }
}
