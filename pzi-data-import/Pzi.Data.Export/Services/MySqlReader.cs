using MySql.Data.MySqlClient;
using System.Data;

namespace Pzi.Data.Export.Services
{
  public class MySqlReader : IDatabaseReader
  {
    private readonly string _connectionString;

    public MySqlReader(string connectionString)
    {
      _connectionString = connectionString;
    }

    public string SchemaName => "Journal";

    public async Task<List<string>> GetTablesAsync()
    {
      var tables = new List<string>();

      await using var connection = new MySqlConnection(_connectionString);
      await connection.OpenAsync();

      string query = "SHOW TABLES;";
      await using var command = new MySqlCommand(query, connection);
      await using var reader = await command.ExecuteReaderAsync();

      while (await reader.ReadAsync())
      {
        tables.Add(reader.GetString(0));
      }

      return tables;
    }

    public async Task<DataTable> LoadDataAsync(string tableName)
    {
      await using var connection = new MySqlConnection(_connectionString);
      await connection.OpenAsync();

      string query = $"SELECT * FROM {tableName}";
      using var adapter = new MySqlDataAdapter(query, connection);

      var dataTable = new DataTable();
      adapter.Fill(dataTable);
      return dataTable;
    }
  }
}
