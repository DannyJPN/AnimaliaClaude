namespace PziApi.Models.Journal;

public class JournalEntryAudit
{
    public long Id { get; set; }
    public int JournalEntryId { get; set; }
    public string ActionType { get; set; } = null!;
    public string? SerializedData { get; set; }
    public string ModifiedBy { get; set; } = null!;
    public DateTime ModifiedAt { get; set; }

    public JournalEntry? JournalEntry { get; set; }
}
