using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.TaxonomyPhyla;

public class Validators
{
  public class TaxonomyGenusUpdateValidator : AbstractValidator<Dtos.TaxonomyPhylumUpdate>
  {
    public TaxonomyGenusUpdateValidator()
    {
      RuleFor(ac => ac.Code).MaximumLength(3).WithErrorCode(ErrorCodes.ERR_TOO_LONG);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }
}