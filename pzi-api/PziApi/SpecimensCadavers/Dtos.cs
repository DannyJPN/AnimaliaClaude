namespace PziApi.SpecimensCadavers;

public class Dtos
{
  public record Item(
    int Id,
    int SpecimenId
  );

  public record ItemUpdate(
    int SpecimenId,
    string? Date,
    string? Location,
    string? Note,
    string? ModifiedBy
  );
}
