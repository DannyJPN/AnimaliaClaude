using System.Runtime.Serialization;

namespace PziApi.CrossCutting;

/// <summary>
/// Modes for inventory exports distinguishing organization hierarchy level.
/// </summary>
public enum OrganizationInventoryModeEnum
{
  /// <summary>Inventory aggregated by region (OrganizationLevel "district").</summary>
  [EnumMember(Value = "region")]
  Region,

  /// <summary>Inventory aggregated by section / workplace (OrganizationLevel "workplace").</summary>
  [EnumMember(Value = "usek")]
  Usek
}
