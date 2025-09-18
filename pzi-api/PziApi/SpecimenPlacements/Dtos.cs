namespace PziApi.SpecimenPlacements;

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

public class Dtos
{
  public record Item(
    int Id
  );

  public record Update(
    int SpecimenId,
    string ValidSince,
    int? LocationId,
    int? OrganizationLevelId,
    string? Note,
    string ModifiedBy
  ) : IValidatableObject
  {
    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
      if (LocationId.HasValue && OrganizationLevelId.HasValue)
      {
        yield return new ValidationResult(
          "Only one of LocationId or OrganizationLevelId can be provided",
          new[] { nameof(LocationId), nameof(OrganizationLevelId) }
        );
      }
      else if (!LocationId.HasValue && !OrganizationLevelId.HasValue)
      {
        yield return new ValidationResult(
          "Either LocationId or OrganizationLevelId must be provided",
          new[] { nameof(LocationId), nameof(OrganizationLevelId) }
        );
      }
    }
  };
}
