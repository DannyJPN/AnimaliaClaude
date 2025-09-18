namespace PziApi.TaxonomyFamilies;

public class Dtos
{
  public record TaxonomyFamily(
    int Id,
    int TaxonomyOrderId,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string? Note,
    string? Synonyms,
    string? ZooStatus
  );

  public record TaxonomyFamilyUpdate(
    int? TaxonomyOrderId,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string? Cryptogram,
    string? Note,
    string? Synonyms,
    string ModifiedBy
 );
}
