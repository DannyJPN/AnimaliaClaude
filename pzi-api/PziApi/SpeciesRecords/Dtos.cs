namespace PziApi.SpeciesRecords;

public class Dtos
{
  public record RecordSpecies(
    int Id,
    int SpeciesId
  );

  public record RecordSpeciesUpdate(
    int SpeciesId,
    string Date,
    string? ActionTypeCode,
    string? Note,
    string? ModifiedBy
  );
}
