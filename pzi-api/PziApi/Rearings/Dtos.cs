namespace PziApi.Rearings;

public class Dtos
{
  public record Item(
    string Code
  );

  public record Update(
    string Code,
    string? DisplayName,
    int Sort,
    string? Note,
    string ModifiedBy
  );
}
