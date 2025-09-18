namespace PziApi.TaxonomyPhyla;

public class Dtos
{
  public record TaxonomyPhylum(
    int Id,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string? ZooStatus
  );

  public record TaxonomyPhylumUpdate(
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string ModifiedBy
 );
}


