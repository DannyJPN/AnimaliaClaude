using PziApi.CrossCutting;
namespace PziApi.JournalEntries;

public class Dtos
{
  public record Item(
    int Id
  );

  public record InsertRequest(
   string AuthorName,
      string EntryDate,
      string EntryType,
      string ActionTypeCode,
      int OrganizationLevelId,
      int SpeciesId,
      string? Note,
      List<SpecimenUpsertItem>? Specimens,
      List<AttributeUpsertItem>? Attributes,
      string ModifiedBy
  );

  public record UpdateRequest(
    string EntryDate,
    string EntryType,
    string ActionTypeCode,
    int OrganizationLevelId,
    int SpeciesId,
    string? Note,
    List<SpecimenUpsertItem>? Specimens,
    List<AttributeUpsertItem>? Attributes,
    string ModifiedBy
  );

  public record ApprovalItem(
    int Id,
    string EntryDate,
    string EntryType,
    string ActionTypeCode,
    int OrganizationLevelId,
    int SpeciesId,
    string? Note,
    List<SpecimenUpsertItem>? Specimens,
    List<AttributeUpsertItem>? Attributes,
    bool IsUpdated
  );

  public record ProcessApprovalRequest(
    List<ApprovalItem> Items,
    string Action,
    string ModifiedBy
  );

  public record AttributeUpsertItem(
    string AttributeTypeCode,
    string? AttributeValue
  );

  public record SpecimenUpsertItem(
    int SpecimenId,
    string? Note,
    List<AttributeUpsertItem>? Attributes
  );

  public record ChangeStatusRequest(
    string ModifiedBy,
    string? ReviewNote
  );

  public record DeleteRequest(string ModifiedBy);

  public record AttributeItem(
    string AttributeTypeCode,
    string? AttributeValue
  );

  public record JournalSpecimenDetailItem(
    int Id,
    int SpecimenId,
    int? SpecimenAccessionNumber,
    string? SpecimenBirthDate,
    string? SpecimenZims,
    string? SpecimenName,
    string? SpecimenGenderTypeCode,
    string? Note,
    List<AttributeItem>? Attributes
  );

  public record EntriesForUserRequest(
    string UserName,
    CommonDtos.Paging Paging,
    List<CommonDtos.Sorting> Sorting,
    List<CommonDtos.Filtering> Filtering
  );

  public record JournalEntryGridItem(
    int Id,
    string AuthorName,
    string CreatedBy,
    DateTime CreatedAt,
    int OrganizationLevelId,
    string? OrganizationLevelName,
    int SpeciesId,
    string? SpeciesNameLat,
    string? SpeciesNameCz,
    string EntryDate,
    string EntryType,
    string ActionTypeCode,
    string ActionTypeDisplayName,
    string Status,
    string? Note,
    bool IsDeleted,
    string? ModifiedBy,
    DateTime? ModifiedAt,
    string? ReviewedBy,
    DateTime? ReviewedAt,
    string? CuratorReviewNote,
    string? ArchiveReviewedBy,
    DateTime? ArchiveReviewedAt,
    string? ArchiveReviewNote,
    IEnumerable<AttributeItem> Attributes,
    IEnumerable<JournalSpecimenDetailItem> Specimens,
    IEnumerable<string> AllowedActions
  );

  public record JournalActionTypesForUserRequest(
    string UserName
  );

  public record JournalActionTypeItem(
    string Code,
    string JournalEntryType,
    int Sort,
    string DisplayName,
    string? Note,
    bool ShowInInsert
  );

  public record DistrictItem(
    int Id,
    string Name,
    string Level
  );
}
