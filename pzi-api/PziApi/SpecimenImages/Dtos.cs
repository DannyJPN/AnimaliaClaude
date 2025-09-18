namespace PziApi.SpecimenImages;

public class Dtos
{
  public record ItemIdResult(
    int Id
  );

  public record ItemUpdate(
    int SpecimenId,
    string Label,
    string? Description,
    byte[]? Image,
    string? ContentType,
    string? ModifiedBy
  );
}
