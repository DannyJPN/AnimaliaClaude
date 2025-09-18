namespace PziApi.Species;

public class Dtos
{
  public record Species(
    int Id,
    int TaxonomyGenusId
  );

  // NOTE: Why is IsEuFauna missing? Else it will be false, what will definitely be wrong. It is used in print reports.
  public record SpeciesUpdate(
    int TaxonomyGenusId,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string? Card,
    bool IsEep,
    bool IsEsb,
    bool IsIsb,
    bool IsGenePool,
    bool IsRegulationRequirement,
    string ClassificationTypeCode,
    int? RegionId,
    string? Note,
    string? Synonyms,
    bool IsEuFauna,
    string? Description,
    string? ModifiedBy
  );

  public record MassSpecimenRecordsRequest(
    int? SpeciesId,
    string? Date,
    string? ActionTypeCode,
    string? Note,
    string? ModifiedBy
  );
}
