namespace PziApi.TaxonomyClasses;

public class Dtos
{
  public record TaxonomyClass(
    int Id,
    int? TaxonomyPhylumId,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string? Cryptogram,
    string? Note,
    string? Synonyms,
    string? Shortcut,
    string? ZooStatus
  );

  public record TaxonomyClassMoveRequest(
    int[] Ids,
    int TargetId,
    string ModifiedBy
  );

  public record TaxonomyClassUpdate(
    int? TaxonomyPhylumId,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string? Cryptogram,
    string? Note,
    string? Synonyms,
    string? Shortcut,
    string? ModifiedBy
 );
}
