namespace PziApi.TaxonomyGenera;

public class Dtos
{
  public record TaxonomyGenus(
    int Id,
    int TaxonomyFamilyId,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    // string? Note, // NOTE: There are no columns for note and synonyms in genera
    // string? Synonyms,
    string? ZooStatus
  );

  public record TaxonomyGenusUpdate(
    int? TaxonomyFamilyId,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string? Cryptogram,
    // string? Note,
    // string? Synonyms,
    string ModifiedBy
 );
}
