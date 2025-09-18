namespace PziApi.Models.Journal;

public class JournalEntryAttribute
{
  public int Id { get; set; }
  public int JournalEntryId { get; set; }
  public string AttributeTypeCode { get; set; } = null!;
  public string? AttributeValue { get; set; }

  public JournalEntry? JournalEntry { get; set; }
}
