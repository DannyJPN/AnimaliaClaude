using System;

namespace PziApi.CrossCutting;

public static class RegionSectionHelper
{
  // Finds closest parent with Level == "department" and returns its Name (Usek)
  public static string? FindClosestDepartmentParent(Models.OrganizationLevel? orgLevel)
  {
    var current = orgLevel?.Parent;
    while (current != null)
    {
      if (current.Level == "department")
      {
        return current.Name;
      }
      current = current.Parent;
    }
    return null;
  }

  // Resolves Rajon/Usek pair from a given organization level
  public static (string rajon, string usek) GetRajonUsek(Models.OrganizationLevel? orgLevel)
  {
    string rajon = string.Empty;
    string usek = string.Empty;

    if (orgLevel != null)
    {
      if (orgLevel.Level == "district")
      {
        rajon = orgLevel.Name;
        usek = FindClosestDepartmentParent(orgLevel) ?? string.Empty;
      }
      else if (orgLevel.Level == "department")
      {
        usek = orgLevel.Name;
      }
      else
      {
        rajon = orgLevel.Name;
      }
    }

    return (rajon, usek);
  }

  // Formats string in form: "date:rajon/usek"
  public static string FormatDateRegionSection(string date, Models.OrganizationLevel? orgLevel)
  {
    var (rajon, usek) = GetRajonUsek(orgLevel);
    return $"{date}:{rajon}/{usek}";
  }
}
