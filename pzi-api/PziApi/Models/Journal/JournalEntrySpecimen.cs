namespace PziApi.Models.Journal;

public class JournalEntrySpecimen
{
    public int Id { get; set; }
    public int JournalEntryId { get; set; }
    public int SpecimenId { get; set; }
    public string? Note { get; set; }
    public string? ModifiedBy { get; set; }
    public DateTime ModifiedAt { get; set; }

    public JournalEntry? JournalEntry { get; set; }
    public Specimen? Specimen { get; set; }
    public ICollection<JournalEntrySpecimenAttribute>? Attributes { get; set; }
}
