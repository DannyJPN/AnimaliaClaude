namespace PziApi.ExpositionAreas;

public class Dtos
{
    public record Item(
        int Id
    );

    public record Update(
        string Name,
        string? Note,
        string? ModifiedBy
    );
}
