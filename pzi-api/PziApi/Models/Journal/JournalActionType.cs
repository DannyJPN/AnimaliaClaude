using System.ComponentModel.DataAnnotations;

namespace PziApi.Models.Journal;

public class JournalActionType
{
    [Key]
    public string Code { get; set; } = null!;
    public string JournalEntryType { get; set; } = null!;
    public int Sort { get; set; }
    public string DisplayName { get; set; } = null!;
    public string? Note { get; set; }
    
    public ICollection<JournalActionTypesToOrganizationLevels>? OrganizationLevels { get; set; }
}
