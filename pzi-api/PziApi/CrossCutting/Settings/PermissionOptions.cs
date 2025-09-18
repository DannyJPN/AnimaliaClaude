using System.Collections.Generic;

namespace PziApi.CrossCutting.Settings
{
    public class PermissionOptions
    {
        public const string SectionName = "Pzi:Permissions";
        
        public bool GrantAllPermissions { get; set; } = false;
        
        public List<string> RecordsRead { get; set; } = new List<string>();
        public List<string> RecordsEdit { get; set; } = new List<string>();
        public List<string> ListsView { get; set; } = new List<string>();
        public List<string> ListsEdit { get; set; } = new List<string>();
        public List<string> DocumentationDepartment { get; set; } = new List<string>();
        public List<string> JournalRead { get; set; } = new List<string>();
    }
}
