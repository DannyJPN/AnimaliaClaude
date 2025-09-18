namespace PziApi.OrganizationLevels;

public class Dtos
{
  public record Item(
      int Id
  );

  public record OrganizationsLevelMoveRequest(
      int[] Ids,
      int TargetId,
      string ModifiedBy
  );

  public record Update(
      int? ParentId,
      string Level,
      string Name,
      string? Director,
      string? JournalApproversGroup,
      string? JournalReadGroup,
      string? JournalContributorGroup,
      string? ModifiedBy
  );
}
