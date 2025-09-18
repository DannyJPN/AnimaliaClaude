using System.ComponentModel.DataAnnotations;

namespace PziApi.Models.Journal;

public class JournalActionTypesToOrganizationLevels
{
    public int Id { get; set; }
    public string ActionTypeCode { get; set; } = null!;
    public int OrganizationLevelId { get; set; }
    
    public JournalActionType? ActionType { get; set; }
    public OrganizationLevel? OrganizationLevel { get; set; }
}
