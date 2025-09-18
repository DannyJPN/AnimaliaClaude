namespace PziApi.TaxonomyOrders;

public class Dtos
{
  public record TaxonomyOrder(
    int Id,
    int TaxonomyClassId,
    string? Code,
    string? NameCz,
    string? NameLat,
    string? NameEn,
    string? NameSk,
    string? Note,
    string? Synonyms,
    string? ZooStatus
  );

  public record TaxonomyOrderUpdate(
    int? TaxonomyClassId,
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

  public class TaxonomyOrderMoveRequest
  {
    public int[] Ids { get; set; } = null!;
    public int TargetId { get; set; }
    public string ModifiedBy { get; set; } = null!;
  }

}
