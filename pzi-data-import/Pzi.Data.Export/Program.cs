using Dapper;
using Microsoft.Data.SqlClient;
using Pzi.Data.Export.Services;
using System.Data;
using System.Diagnostics;

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

    Console.WriteLine("Enter the connection string for the MSSQL database:");
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

  static async Task CleanupTargetDatabaseAsync(string targetSchema, string sqlServerConnectionString)
  {
    var sql = $@"
            IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'{targetSchema}' )
	            EXEC('CREATE SCHEMA [{targetSchema}]');

            DECLARE @sql NVARCHAR(MAX) = '';

            SELECT @sql += 'IF OBJECT_ID(''' + TABLE_SCHEMA + '.' + TABLE_NAME + ''', ''U'') IS NOT NULL DROP TABLE ' + QUOTENAME(TABLE_SCHEMA) + '.' + QUOTENAME(TABLE_NAME) + '; '
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = '{targetSchema}';

            EXEC sp_executesql @sql;";

    await using var sqlConnection = new SqlConnection(sqlServerConnectionString);
    await sqlConnection.OpenAsync();
    await sqlConnection.ExecuteAsync(sql);

    Console.WriteLine("Target database cleanup finished.");
  }

  static async Task MigrateTableAsync(IDatabaseReader sourceReader, string tableName, string firebirdConnectionString, string sqlServerConnectionString)
  {
    Console.WriteLine($"Processing table: {tableName}");

    var sw = Stopwatch.StartNew();

    var targetSchema = sourceReader.SchemaName;
    using var data = await sourceReader.LoadDataAsync(tableName);

    await using var sqlConnection = new SqlConnection(sqlServerConnectionString);
    await sqlConnection.OpenAsync();

    sw.Stop();
    Console.WriteLine($"Read finished: {sw.Elapsed}");
    sw.Restart();

    await CreateSqlTableIfNotExistsAsync(sqlConnection, targetSchema, tableName, data);
    await InsertDataIntoSqlAsync(sqlConnection, targetSchema, tableName, data);

    sw.Stop();
    Console.WriteLine($"Table [{tableName}] processed. ({sw.Elapsed})");
  }

  static async Task CreateSqlTableIfNotExistsAsync(SqlConnection sqlConnection, string schema, string tableName, DataTable data)
  {
    var createTableCommand = $"CREATE TABLE [{schema}].[{tableName}] (";

    foreach (DataColumn column in data.Columns)
    {
      createTableCommand += $"[{column.ColumnName}] {GetSqlDataType(column.DataType)},";
    }

    createTableCommand = createTableCommand.TrimEnd(',') + ");";
    await using var command = new SqlCommand(createTableCommand, sqlConnection);
    await command.ExecuteNonQueryAsync();

    Console.WriteLine($"Table [{schema}].[{tableName}] created.");
  }

  static string GetSqlDataType(Type type)
  {
    return type switch
    {
      _ when type == typeof(int) => "INT",
      _ when type == typeof(string) => "NVARCHAR(MAX)",
      _ when type == typeof(DateTime) => "DATETIME",
      _ when type == typeof(bool) => "BIT",
      _ when type == typeof(decimal) => "DECIMAL(18,2)",
      _ => "NVARCHAR(MAX)"
    };
  }

  static async Task InsertDataIntoSqlAsync(SqlConnection connection, string schema, string tableName, DataTable data)
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

    using (var bulkCopy = new SqlBulkCopy(connection))
    {
      bulkCopy.DestinationTableName = $"{schema}.{tableName}";
      //bulkCopy.BatchSize = 10000;
      bulkCopy.BulkCopyTimeout = 600;

      foreach (DataColumn column in data.Columns)
      {
        bulkCopy.ColumnMappings.Add(column.ColumnName, column.ColumnName);
      }

      try
      {
        await bulkCopy.WriteToServerAsync(data);
      }
      catch (Exception ex)
      {
        Console.WriteLine($"Error to add data: {ex.Message}");
      }
    }

    Console.WriteLine($"Data inserted into table [{schema}].[{tableName}].");
  }


  static async Task InsertDataIntoSqlAsync_old(SqlConnection sqlConnection, string schema, string tableName, DataTable data)
  {
    foreach (DataRow row in data.Rows)
    {
      var columns = string.Join(",", data.Columns.Cast<DataColumn>().Select(c => $"[{c.ColumnName}]"));
      var values = string.Join(",", data.Columns.Cast<DataColumn>().Select(c => $"@{c.ColumnName}"));

      var insertCommand = $"INSERT INTO [{schema}].[{tableName}] ({columns}) VALUES ({values})";
      await using var command = new SqlCommand(insertCommand, sqlConnection);

      foreach (DataColumn column in data.Columns)
      {
        command.Parameters.AddWithValue($"@{column.ColumnName}", row[column] ?? DBNull.Value);
      }

      await command.ExecuteNonQueryAsync();
    }

    Console.WriteLine($"Data inserted into table [{schema}].[{tableName}].");
  }
}