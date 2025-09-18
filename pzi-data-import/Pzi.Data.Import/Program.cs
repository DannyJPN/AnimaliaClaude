using Dapper;
using Microsoft.Data.SqlClient;
using Pzi.Data.Import;
using Pzi.Data.Import.Services;
using System.Diagnostics;
using System.Resources;

class Program
{
  private const int DefaultCommandTimeout = 0;
  // not supported on azure SQL
  private const string EnableIdentityInsertCommand = @"EXEC sp_MSforeachtable @command1 = 'SET IDENTITY_INSERT ? ON', @whereand = ' AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = o.id AND is_identity = 1)'";
  private const string DisableIdenityInsertCommand = @"EXEC sp_MSforeachtable @command1 = 'SET IDENTITY_INSERT ? OFF', @whereand = ' AND EXISTS (SELECT 1 FROM sys.columns WHERE object_id = o.id AND is_identity = 1)'";

  static async Task Main(string[] args)
  {
    Console.WriteLine("Enter the connection string for the database:");
    string connectionString = Console.ReadLine();
    if (string.IsNullOrWhiteSpace(connectionString))
    {
      Console.WriteLine($"Source connection string cannot be empty.");
      return;
    }

    // workaround because of SqlScripts resources not working same as in previous version of vs
    var resourceManager = SqlScripts.ResourceManager;

    var overallStopwatch = Stopwatch.StartNew();

    await using var sqlConnection = new SqlConnection(connectionString);
    await sqlConnection.OpenAsync();

    Console.WriteLine("Starting transaction.");

    await using var tran = sqlConnection.BeginTransaction();

    try
    {
      Console.WriteLine("Recreating database tables (DROP and CREATE).");

      await sqlConnection.ExecuteAsync(resourceManager.GetString("_00_RecreateDatabase_MigrationScript")!, transaction: tran);

      Console.WriteLine("Importing A tables data.");

      await sqlConnection.ExecuteAsync(resourceManager.GetString("_01_InitialTables_MigrationScript")!, transaction: tran, commandTimeout: DefaultCommandTimeout);
      await sqlConnection.ExecuteAsync(resourceManager.GetString("_02_TablesA_MigrationScript")!, transaction: tran, commandTimeout: DefaultCommandTimeout);

      Console.WriteLine("Importing B tables data (invertebrates).");

      await sqlConnection.ExecuteAsync(resourceManager.GetString("_03_TablesB_MigrationScript")!, transaction: tran, commandTimeout: DefaultCommandTimeout);

      Console.WriteLine("Mapping organization levels to specimen placements.");

      await sqlConnection.ExecuteAsync(resourceManager.GetString("_04_SpecimenPlacements_OrganizationLevels_Mappings")!, transaction: tran, commandTimeout: DefaultCommandTimeout);


      Console.WriteLine("Creating views.");

      await sqlConnection.ExecuteAsync(resourceManager.GetString("_05_CreateView-TaxonomyHierarchyView")!, transaction: tran, commandTimeout: DefaultCommandTimeout);
      await sqlConnection.ExecuteAsync(resourceManager.GetString("_06_CreateView-ExpositionHierarchyView")!, transaction: tran, commandTimeout: DefaultCommandTimeout);
      await sqlConnection.ExecuteAsync(resourceManager.GetString("_07_CreateView-OrganizationHierarchyView")!, transaction: tran, commandTimeout: DefaultCommandTimeout);
      await sqlConnection.ExecuteAsync(resourceManager.GetString("_08_CreateIndexes")!, transaction: tran, commandTimeout: DefaultCommandTimeout);

      Console.WriteLine("Done. Commiting transaction.");

      tran.Commit();

      await sqlConnection.CloseAsync();

      Console.WriteLine($"Data imported. Processing time: {overallStopwatch.Elapsed}.");
    }
    catch (Exception ex)
    {
      tran.Rollback();

      Console.WriteLine($"Transaction rollbacked. An error occurred: {ex}");

      throw;
    }

    Console.WriteLine("Importing Locations.");

    var locationDataImportService = new LocationsDataImportService(connectionString);
    var filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "Locations.csv");
    await locationDataImportService.ImportLocationsFromCsv(filePath);


    Console.WriteLine("Calculating quantities.");

    var movementCalculationService = new MovementsCalculationService(connectionString);
    await movementCalculationService.CalculateAndSaveSpecimenQuantities();
    await movementCalculationService.FixPlacementsNotInZoo();

    overallStopwatch.Stop();
    Console.WriteLine($"Total import time: {overallStopwatch.Elapsed}.");
  }

  // NOTE: Currently we will use initial script to drop and create tables to simplify process
  static async Task CleanupDatabaseAsync(SqlConnection sqlConnection)
  {
    var sql = @"
            DECLARE @sql NVARCHAR(MAX);

            EXEC sp_msforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT all;'

            SELECT @sql = STRING_AGG('TRUNCATE TABLE [' + TABLE_SCHEMA + '].[' + TABLE_NAME + '];', CHAR(13) + CHAR(10))
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_SCHEMA = 'dbo'
            AND TABLE_TYPE = 'BASE TABLE';

            EXEC sp_executesql @sql;

            EXEC sp_msforeachtable 'ALTER TABLE ? WITH CHECK CHECK CONSTRAINT all;'";

    await sqlConnection.ExecuteAsync(sql);

    Console.WriteLine("Target database cleanup finished.");
  }
}