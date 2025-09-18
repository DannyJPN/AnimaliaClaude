namespace PziApi.SpecimensMarkings;

public class Dtos
{
  public record Item(
    int Id,
    int SpecimenId
  );

  public record ItemUpdate(
    int SpecimenId,
    string MarkingTypeCode,
    string? RingNumber,
    string? Color,
    string? Side,
    string? LocatedOn,
    bool IsValid,
    string? MarkingDate,
    string? Note,
    string? ModifiedBy
  );
}
