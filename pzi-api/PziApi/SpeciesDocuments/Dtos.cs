namespace PziApi.SpeciesDocuments;

public class Dtos
{
  public record Item(
    int Id,
    int SpeciesId
  );

  public record ItemUpdate(
    int SpeciesId,
    string DocumentTypeCode,
    string Date,
    string Number,
    string? Note,
    bool IsValid,
    string? ModifiedBy
  );
}
