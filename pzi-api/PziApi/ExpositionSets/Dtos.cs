namespace PziApi.ExpositionSets;

public class Dtos
{
    public record Item(
        int Id
    );

    public record ExpositionSetMoveRequest(
    int[] Ids,
    int TargetId,
    string ModifiedBy
  );

    public record Update(
        int ExpositionAreaId,
        string Name,
        string? Note,
        string? ModifiedBy
    );
}
