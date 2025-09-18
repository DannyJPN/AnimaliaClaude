using FirebirdSql.Data.FirebirdClient;
using System.Data;

namespace Pzi.Data.Export.Services
{
  public class FirebirdReader : IDatabaseReader
  {
    private readonly string _connectionString;

    public FirebirdReader(string connectionString)
    {
      _connectionString = connectionString;
    }

    public string SchemaName => "Raw";

    public async Task<List<string>> GetTablesAsync()
    {
      var tables = new List<string>();

      await using var connection = new FbConnection(_connectionString);
      await connection.OpenAsync();

      string query = "SELECT RDB$RELATION_NAME FROM RDB$RELATIONS WHERE RDB$SYSTEM_FLAG = 0 AND RDB$VIEW_SOURCE IS NULL";
      await using var command = new FbCommand(query, connection);
      await using var reader = await command.ExecuteReaderAsync();

      while (await reader.ReadAsync())
      {
        tables.Add(reader.GetString(0).Trim());
      }

      return tables;
    }

    public async Task<DataTable> LoadDataAsync(string tableName)
    {
      await using var connection = new FbConnection(_connectionString);
      await connection.OpenAsync();

      string query = $"SELECT * FROM {tableName}";
      using var adapter = new FbDataAdapter(query, connection);

      var dataTable = new DataTable();
      adapter.Fill(dataTable);
      return dataTable;
    }
  }
}
