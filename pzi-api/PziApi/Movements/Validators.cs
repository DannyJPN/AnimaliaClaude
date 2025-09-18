using FluentValidation;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Movements;

public class Validators
{
  public class MovementUpdateValidator : AbstractValidator<Dtos.MovementUpdate>
  {
    public MovementUpdateValidator(PziDbContext dbContext)
    {
      RuleFor(ac => ac.SpecimenId).NotNull();
      RuleFor(ac => ac.Date).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.Quantity).GreaterThanOrEqualTo(0).WithErrorCode(ErrorCodes.ERR_INVALID_VALUE);
      RuleFor(ac => ac.QuantityActual).GreaterThanOrEqualTo(0).WithErrorCode(ErrorCodes.ERR_INVALID_VALUE);

      RuleFor(ac => ac).CustomAsync(async (ac, ctx, cancellationToken) =>
      {
        var specimen = await dbContext.Specimens.FirstOrDefaultAsync(s => s.Id == ac.SpecimenId);

        if (specimen == null)
        {
          ctx.AddFailure(new FluentValidation.Results.ValidationFailure()
          {
            PropertyName = nameof(ac.SpecimenId),
            ErrorCode = ErrorCodes.ERR_NOT_FOUND
          });

          return;
        }

        if (specimen.ClassificationTypeCode == "E")
        {
          if (ac.Quantity > 1)
          {
            ctx.AddFailure(new FluentValidation.Results.ValidationFailure()
            {
              PropertyName = nameof(ac.Quantity),
              ErrorCode = ErrorCodes.ERR_INVALID_VALUE
            });
          }

          if (ac.QuantityActual > 1)
          {
            ctx.AddFailure(new FluentValidation.Results.ValidationFailure()
            {
              PropertyName = nameof(ac.QuantityActual),
              ErrorCode = ErrorCodes.ERR_INVALID_VALUE
            });
          }
        }
      });
    }
  }
}
