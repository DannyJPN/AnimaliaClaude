namespace PziApi.Models.Journal;

public class JournalEntry
{
  public int Id { get; set; }
  public int OrganizationLevelId { get; set; }
  public int SpeciesId { get; set; }
  public string AuthorName { get; set; } = null!;
  public string EntryType { get; set; } = null!;
  public DateTime EntryDate { get; set; }
  public string ActionTypeCode { get; set; } = null!;
  public string Status { get; set; } = null!;
  public string? Note { get; set; }
  public bool IsDeleted { get; set; }
  public string CreatedBy { get; set; } = null!;
  public DateTime CreatedAt { get; set; }
  public string? ModifiedBy { get; set; }
  public DateTime ModifiedAt { get; set; }
  public string? ReviewedBy { get; set; }
  public DateTime? ReviewedAt { get; set; }
  public string? CuratorReviewNote { get; set; }
  public string? ArchiveReviewedBy { get; set; }
  public DateTime? ArchiveReviewedAt { get; set; }
  public string? ArchiveReviewNote { get; set; }

  public OrganizationLevel? OrganizationLevel { get; set; }
  public JournalActionType? ActionType { get; set; }
  public Species? Species { get; set; }
  public ICollection<JournalEntrySpecimen>? Specimens { get; set; }
  public ICollection<JournalEntryAttribute>? Attributes { get; set; }
}
