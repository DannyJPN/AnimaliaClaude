using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.TaxonomyClasses;

public class Validators
{
  public class TaxonomyClassUpdateValidator : AbstractValidator<Dtos.TaxonomyClassUpdate>
  {
    public TaxonomyClassUpdateValidator()
    {
      RuleFor(ac => ac.Code).MaximumLength(2).WithErrorCode(ErrorCodes.ERR_TOO_LONG);
      RuleFor(ac => ac.Cryptogram).MaximumLength(5).WithErrorCode(ErrorCodes.ERR_TOO_LONG);
      RuleFor(ac => ac.Shortcut).MaximumLength(3).WithErrorCode(ErrorCodes.ERR_TOO_LONG);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }

  public class TaxonomyClassUpdateWarningsValidator : AbstractValidator<Models.TaxonomyClass>
  {
    public TaxonomyClassUpdateWarningsValidator(PziDbContext dbContext)
    {
      RuleFor(ac => ac.Code).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);

      RuleFor(ac => ac.Code).MustAsync(async (ac, code, cancellationToken) => {
        var duplicateCodesCount = await dbContext.TaxonomyClasses.CountAsync(tc => tc.Id != ac.Id && tc.Code == code);

        return duplicateCodesCount == 0;
      }).WithErrorCode(ErrorCodes.ERR_DUPLICATE_VALUE);
    }
  }

  
  public class TaxonomyClassMoveValidator : AbstractValidator<Dtos.TaxonomyClassMoveRequest>
  {
    public TaxonomyClassMoveValidator()
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
        .WithMessage("Target phylum ID must be greater than 0");

      RuleFor(x => x.ModifiedBy)
        .NotEmpty()
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("ModifiedBy is required");
    }
  }
}
