namespace PziApi.Locations;

public class Dtos
{
  public record Item(
      int Id
  );

  public record LocationsMoveRequest(
    int[] Ids,
    int TargetId,
    string ModifiedBy
  );

  public record Update(
  int? OrganizationLevelId,
  int? ExpositionSetId,
  string Name,
  int? ObjectNumber,
  int? RoomNumber,
  bool AvailableForVisitors,
  int LocationTypeCode,
  decimal? AreaM2,
  decimal? CapacityM3,
  string? Note,
  string? ModifiedBy
);
}
