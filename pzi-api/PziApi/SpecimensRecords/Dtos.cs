namespace PziApi.SpecimensRecords;

public class Dtos
{
  public record Item(
    int Id,
    int SpecimenId
  );

  public record ItemUpdate(
    int SpecimenId,
    string Date,
    string? ActionTypeCode,
    string? Note,
    int? PartnerId,
    string? ModifiedBy
  );
}
