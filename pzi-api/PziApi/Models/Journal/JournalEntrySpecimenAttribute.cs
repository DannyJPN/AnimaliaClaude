namespace PziApi.Models.Journal;

public class JournalEntrySpecimenAttribute
{
  public int Id { get; set; }
  public int JournalEntrySpecimenId { get; set; }
  public string AttributeTypeCode { get; set; } = null!;
  public string? AttributeValue { get; set; }

  public JournalEntrySpecimen? JournalEntrySpecimen { get; set; }
}
