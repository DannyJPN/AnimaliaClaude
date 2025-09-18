using FluentValidation;
using PziApi.CrossCutting;

namespace PziApi.SpeciesDocuments;

public class Validators
{
  public class UpdateValidator : AbstractValidator<Dtos.ItemUpdate>
  {
    public UpdateValidator()
    {
      RuleFor(ac => ac.SpeciesId).NotNull().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.ModifiedBy).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.DocumentTypeCode).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(ac => ac.Number).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }
}
