using Dapper;
using Npgsql;
using Pzi.Data.Export.Services;
using System.Data;
using System.Diagnostics;
using System.Text;

class Program
{
  static async Task Main(string[] args)
  {
    Console.WriteLine("Choose source database type: 1 - Firebird, 2 - MySQL");
    string? sourceType = Console.ReadLine();

    if (string.IsNullOrWhiteSpace(sourceType) || (sourceType != "1" && sourceType != "2"))
    {
      Console.WriteLine($"Source type must be equal to 1 or 2.");
      return;
    }

    Console.WriteLine("Enter the connection string for the source database:");
    string? sourceConnectionString = Console.ReadLine();
    if (string.IsNullOrWhiteSpace(sourceConnectionString))
    {
      Console.WriteLine($"Source connection string cannot be empty.");
      return;
    }

    Console.WriteLine("Enter the connection string for the PostgreSQL database:");
    string? sqlServerConnectionString = Console.ReadLine();
    if (string.IsNullOrWhiteSpace(sqlServerConnectionString))
    {
      Console.WriteLine($"Target connection string cannot be empty.");
      return;
    }

    IDatabaseReader sourceReader = sourceType switch
    {
      "1" => new FirebirdReader(sourceConnectionString),
      "2" => new MySqlReader(sourceConnectionString),
      _ => throw new NotSupportedException("Unsupported source type.")
    };

    var overallStopwatch = Stopwatch.StartNew();

    try
    {
      Console.WriteLine($"Loading Source tables.");

      var tables = await sourceReader.GetTablesAsync();

      Console.WriteLine($"Target database cleanup started. All existing tables will be dropped.");

      await CleanupTargetDatabaseAsync(sourceReader.SchemaName, sqlServerConnectionString);

      Console.WriteLine("Importing tables from the source database started.");

      foreach (var tableName in tables)
      {
        await MigrateTableAsync(sourceReader, tableName, sourceConnectionString, sqlServerConnectionString);
      }
    }
    catch (Exception ex)
    {
      Console.WriteLine($"An error occurred: {ex}");
    }
    finally
    {
      overallStopwatch.Stop();
      Console.WriteLine($"Total migration time: {overallStopwatch.Elapsed}.");
    }
  }

  static async Task CleanupTargetDatabaseAsync(string targetSchema, string postgresConnectionString)
  {
    await using var connection = new NpgsqlConnection(postgresConnectionString);
    await connection.OpenAsync();

    // Create schema if not exists
    var createSchemaSQL = $"CREATE SCHEMA IF NOT EXISTS \"{targetSchema}\"";
    await connection.ExecuteAsync(createSchemaSQL);

    // Get all tables in the schema and drop them
    var getTablesSQL = @"
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = @schema AND table_type = 'BASE TABLE'";

    var tables = await connection.QueryAsync<string>(getTablesSQL, new { schema = targetSchema });

    foreach (var table in tables)
    {
      var dropSQL = $"DROP TABLE IF EXISTS \"{targetSchema}\".\"{table}\" CASCADE";
      await connection.ExecuteAsync(dropSQL);
    }

    Console.WriteLine("Target database cleanup finished.");
  }

  static async Task MigrateTableAsync(IDatabaseReader sourceReader, string tableName, string firebirdConnectionString, string sqlServerConnectionString)
  {
    Console.WriteLine($"Processing table: {tableName}");

    var sw = Stopwatch.StartNew();

    var targetSchema = sourceReader.SchemaName;
    using var data = await sourceReader.LoadDataAsync(tableName);

    await using var sqlConnection = new NpgsqlConnection(sqlServerConnectionString);
    await sqlConnection.OpenAsync();

    sw.Stop();
    Console.WriteLine($"Read finished: {sw.Elapsed}");
    sw.Restart();

    await CreateSqlTableIfNotExistsAsync(sqlConnection, targetSchema, tableName, data);
    await InsertDataIntoSqlAsync(sqlConnection, targetSchema, tableName, data);

    sw.Stop();
    Console.WriteLine($"Table [{tableName}] processed. ({sw.Elapsed})");
  }

  static async Task CreateSqlTableIfNotExistsAsync(NpgsqlConnection connection, string schema, string tableName, DataTable data)
  {
    var createTableCommand = $"CREATE TABLE IF NOT EXISTS \"{schema}\".\"{tableName}\" (";

    foreach (DataColumn column in data.Columns)
    {
      createTableCommand += $"\"{column.ColumnName}\" {GetPostgreSqlDataType(column.DataType)},";
    }

    createTableCommand = createTableCommand.TrimEnd(',') + ");";
    await using var command = new NpgsqlCommand(createTableCommand, connection);
    await command.ExecuteNonQueryAsync();

    Console.WriteLine($"Table \"{schema}\".\"{tableName}\" created.");
  }

  static string GetPostgreSqlDataType(Type type)
  {
    return type switch
    {
      _ when type == typeof(int) => "INTEGER",
      _ when type == typeof(string) => "TEXT",
      _ when type == typeof(DateTime) => "TIMESTAMP",
      _ when type == typeof(bool) => "BOOLEAN",
      _ when type == typeof(decimal) => "DECIMAL(18,2)",
      _ => "TEXT"
    };
  }

  static async Task InsertDataIntoSqlAsync(NpgsqlConnection connection, string schema, string tableName, DataTable data)
  {
    if (data == null || data.Rows.Count == 0)
    {
      Console.WriteLine("No rows to insert.");
      return;
    }

    if (connection.State == ConnectionState.Closed)
    {
      await connection.OpenAsync();
    }

    try
    {
      // Use PostgreSQL COPY for bulk insert
      var columnNames = string.Join(", ", data.Columns.Cast<DataColumn>().Select(c => $"\"{c.ColumnName}\""));
      var copyCommand = $"COPY \"{schema}\".\"{tableName}\" ({columnNames}) FROM STDIN WITH (FORMAT CSV)";

      await using var writer = await connection.BeginTextImportAsync(copyCommand);

      foreach (DataRow row in data.Rows)
      {
        var values = new List<string>();
        foreach (var item in row.ItemArray)
        {
          if (item == null || item == DBNull.Value)
          {
            values.Add("");
          }
          else if (item is string str)
          {
            // Escape quotes and wrap in quotes
            values.Add($"\"{str.Replace("\"", "\"\"")}\"");
          }
          else if (item is DateTime dt)
          {
            values.Add($"\"{dt:yyyy-MM-dd HH:mm:ss}\"");
          }
          else if (item is bool b)
          {
            values.Add(b ? "true" : "false");
          }
          else
          {
            values.Add($"\"{item}\"");
          }
        }
        await writer.WriteLineAsync(string.Join(",", values));
      }

      await writer.FlushAsync();
    }
    catch (Exception ex)
    {
      Console.WriteLine($"Error to add data: {ex.Message}");
    }

    Console.WriteLine($"Data inserted into table \"{schema}\".\"{tableName}\".");
  }


  static async Task InsertDataIntoSqlAsync_old(NpgsqlConnection connection, string schema, string tableName, DataTable data)
  {
    foreach (DataRow row in data.Rows)
    {
      var columns = string.Join(",", data.Columns.Cast<DataColumn>().Select(c => $"\"{c.ColumnName}\""));
      var values = string.Join(",", data.Columns.Cast<DataColumn>().Select(c => $"@{c.ColumnName}"));

      var insertCommand = $"INSERT INTO \"{schema}\".\"{tableName}\" ({columns}) VALUES ({values})";
      await using var command = new NpgsqlCommand(insertCommand, connection);

      foreach (DataColumn column in data.Columns)
      {
        command.Parameters.AddWithValue($"@{column.ColumnName}", row[column] ?? DBNull.Value);
      }

      await command.ExecuteNonQueryAsync();
    }

    Console.WriteLine($"Data inserted into table \"{schema}\".\"{tableName}\".");
  }
}