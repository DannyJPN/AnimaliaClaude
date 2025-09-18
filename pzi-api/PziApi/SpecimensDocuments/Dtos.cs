namespace PziApi.SpecimensDocuments;

public class Dtos
{
  public record Item(
    int Id,
    int SpecimenId
  );

  public record ItemUpdate(
    int SpecimenId,
    string DocumentTypeCode,
    string Number,
    string? Date,
    string? Partner,
    string? Note,
    bool IsValid,
    string? ModifiedBy
  );
}
