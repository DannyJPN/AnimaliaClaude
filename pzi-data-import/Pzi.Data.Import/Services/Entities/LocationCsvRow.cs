namespace Pzi.Data.Import.Services.Entities
{
  public class LocationCsvRow
  {
    public string ExpositionAreaName { get; set; }
    public string ExpositionSectionName { get; set; }
    public string Name { get; set; }
    public string? ObjectNumber { get; set; }
    public string? RoomNumber { get; set; }
    public bool AvailableForVisitors { get; set; }
    public int LocationTypeCode { get; set; }
    public string? Note { get; set; }
    public string District { get; set; }
    public string Workplace { get; set; }
    public string Department { get; set; }

    public void TrimAll()
    {
      ExpositionAreaName = Trim(ExpositionAreaName);
      ExpositionSectionName = Trim(ExpositionSectionName);
      Name = Trim(Name);
      ObjectNumber = Trim(ObjectNumber);
      RoomNumber = Trim(RoomNumber);
      Note = Trim(Note);
      District = Trim(District);
      Workplace = Trim(Workplace);
      Department = Trim(Department);
    }

    private static string? Trim(string input) =>
        string.IsNullOrWhiteSpace(input) ? null : input.Trim();
  }
}
