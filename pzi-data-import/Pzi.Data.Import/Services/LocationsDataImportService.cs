using CsvHelper;
using CsvHelper.Configuration;
using Dapper;
using Npgsql;
using Pzi.Data.Import.Services.Entities;
using System.Globalization;

namespace Pzi.Data.Import.Services
{
  public class LocationMap : ClassMap<LocationCsvRow>
  {
    public LocationMap()
    {
      Map(m => m.ExpositionAreaName);
      Map(m => m.ExpositionSectionName);
      Map(m => m.Name);
      Map(m => m.ObjectNumber);
      Map(m => m.RoomNumber);
      Map(m => m.AvailableForVisitors).Default(false);
      Map(m => m.LocationTypeCode).Default(0);
      Map(m => m.Note);
      Map(m => m.District);
      Map(m => m.Workplace);
      Map(m => m.Department);
    }
  }

  public class LocationsDataImportService
  {
    private const string _tempTableName = "#LocationsTemp";
    private readonly string _connectionString;
    public LocationsDataImportService(string connectionString)
    {
      _connectionString = string.IsNullOrWhiteSpace(connectionString) ? throw new ArgumentNullException(nameof(connectionString)) : connectionString;
    }

    public async Task ImportLocationsFromCsv(string filePath)
    {
      var locations = LoadLocationsFromCsv(filePath);

      var deduplicatedLocations = locations
        .GroupBy(r => new
        {
          r.ExpositionAreaName,
          r.ExpositionSectionName,
          r.Name,
          r.ObjectNumber,
          r.RoomNumber,
          r.AvailableForVisitors,
          r.LocationTypeCode,
          r.District,
          r.Workplace,
          r.Department
        })
        .Select(g => new LocationCsvRow
        {
          ExpositionAreaName = g.Key.ExpositionAreaName,
          ExpositionSectionName = g.Key.ExpositionSectionName,
          Name = g.Key.Name,
          ObjectNumber = g.Key.ObjectNumber,
          RoomNumber = g.Key.RoomNumber,
          AvailableForVisitors = g.Key.AvailableForVisitors,
          LocationTypeCode = g.Key.LocationTypeCode,
          Note = string.Join(", ", g.Select(x => x.Note).Distinct()),
          District = g.Key.District,
          Workplace = g.Key.Workplace,
          Department = g.Key.Department
        })
        .ToList();

      await ProcessSpecimenDataAsync(deduplicatedLocations);
    }

    private static List<LocationCsvRow> LoadLocationsFromCsv(string filePath)
    {
      var config = new CsvConfiguration(CultureInfo.InvariantCulture)
      {
        HeaderValidated = null,
        MissingFieldFound = null,
        HasHeaderRecord = true,
        Delimiter = ","
      };

      using var reader = new StreamReader(filePath);
      using var csv = new CsvReader(reader, config);

      csv.Context.RegisterClassMap<LocationMap>();
      var records = csv.GetRecords<LocationCsvRow>().ToList();
      foreach (var r in records)
        r.TrimAll();

      return records;
    }

    private async Task ProcessSpecimenDataAsync(List<LocationCsvRow> calculatedData)
    {
      using (var connection = new NpgsqlConnection(_connectionString))
      {
        await connection.OpenAsync();
        using (var transaction = connection.BeginTransaction())
        {
          try
          {
            await CreateTempTableAsync(connection, transaction);

            await BulkInsertStagingTableAsync(calculatedData, connection, transaction);

            await connection.ExecuteAsync(@$"
              INSERT INTO \"Locations\" (
                              \"Name\", \"ObjectNumber\", \"RoomNumber\", \"AvailableForVisitors\",
                              \"LocationTypeCode\", \"Note\", \"OrganizationLevelId\", \"ExpositionSetId\", \"ModifiedBy\", \"ModifiedAt\")
              SELECT
                t.\"Name\",
                t.\"ObjectNumber\",
                t.\"RoomNumber\",
                t.\"AvailableForVisitors\",
                t.\"LocationTypeCode\",
                t.\"Note\",
                ol.\"OrganizationLevelId\",
                s.\"Id\" AS \"ExpositionSetId\",
                'system' AS \"CreatedBy\",
                NOW() AS \"CreatedDate\"
              FROM \"{_tempTableName}\" t
              LEFT JOIN \"ExpositionSets\" s ON t.\"ExpositionSectionName\" = s.\"Name\"
              LEFT JOIN LATERAL (
                  SELECT
                      l1.\"Id\" AS \"OrganizationLevelId\",
                      l1.\"Name\" AS \"DistrictName\",
                      l2.\"Name\" AS \"WorkplaceName\"
                  FROM \"OrganizationLevels\" l1
                  JOIN \"OrganizationLevels\" l2 ON l1.\"ParentId\" = l2.\"Id\"
                  WHERE
                      l1.\"Name\" = t.\"District\" AND l1.\"Level\" = 'district' AND
                      l2.\"Name\" = t.\"Workplace\" AND l1.\"ParentId\" = l2.\"Id\" AND l2.\"Level\" = 'workplace'
              ) ol ON true;
              ", transaction: transaction, commandTimeout: 0);

            await connection.ExecuteAsync($"DROP TABLE IF EXISTS \"{_tempTableName}\";", transaction: transaction);

            transaction.Commit();

            Console.WriteLine("Locations imported!");
          }
          catch (Exception ex)
          {
            transaction.Rollback();
            Console.WriteLine($"Error during locations import: {ex.Message}");
            throw;
          }
        }
      }
    }

    private async Task BulkInsertStagingTableAsync(IEnumerable<LocationCsvRow> data, NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
      // Use PostgreSQL COPY command for bulk insert
      var copyCommand = $"COPY \"{_tempTableName}\" (\"ExpositionAreaName\", \"ExpositionSectionName\", \"Name\", \"ObjectNumber\", \"RoomNumber\", \"AvailableForVisitors\", \"LocationTypeCode\", \"Note\", \"District\", \"Workplace\", \"Department\") FROM STDIN WITH (FORMAT CSV)";

      await using var writer = await connection.BeginTextImportAsync(copyCommand);

      foreach (var row in data)
      {
        var values = new List<string>
        {
          EscapeCsvValue(row.ExpositionAreaName),
          EscapeCsvValue(row.ExpositionSectionName),
          EscapeCsvValue(row.Name),
          EscapeCsvValue(row.ObjectNumber),
          EscapeCsvValue(row.RoomNumber),
          row.AvailableForVisitors ? "true" : "false",
          row.LocationTypeCode.ToString(),
          EscapeCsvValue(row.Note),
          EscapeCsvValue(row.District),
          EscapeCsvValue(row.Workplace),
          EscapeCsvValue(row.Department)
        };

        await writer.WriteLineAsync(string.Join(",", values));
      }

      await writer.FlushAsync();
    }

    private static string EscapeCsvValue(string? value)
    {
      if (string.IsNullOrEmpty(value))
        return "";

      // Escape quotes by doubling them and wrap in quotes
      return $"\"{value.Replace("\"", "\"\"")}\"";
    }

    private static async Task CreateTempTableAsync(NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
      var sql = @$"
           DROP TABLE IF EXISTS \"{_tempTableName}\";

           CREATE TEMP TABLE \"{_tempTableName}\" (
              \"ExpositionAreaName\" TEXT,
              \"ExpositionSectionName\" TEXT,
              \"Name\" TEXT,
              \"ObjectNumber\" VARCHAR(50),
              \"RoomNumber\" VARCHAR(50),
              \"AvailableForVisitors\" BOOLEAN,
              \"LocationTypeCode\" INTEGER,
              \"Note\" TEXT,
              \"District\" TEXT,
              \"Workplace\" TEXT,
              \"Department\" TEXT
          );";

      await connection.ExecuteAsync(sql, transaction: transaction);
    }
  }
}
