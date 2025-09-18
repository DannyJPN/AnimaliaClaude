using Dapper;
using Microsoft.Data.SqlClient;
using Pzi.Data.Import.Services.Entities;

namespace Pzi.Data.Import.Services
{
  public class MovementsCalculationService
  {
    private readonly string _connectionString;
    public MovementsCalculationService(string connectionString)
    {
      _connectionString = string.IsNullOrWhiteSpace(connectionString) ? throw new ArgumentNullException(nameof(connectionString)) : connectionString;
    }

    public async Task CalculateAndSaveSpecimenQuantities()
    {
      var movementCalculations = new List<SpecimenCalculationResult>();
      var movementsDictionary = await LoadMovementsAsync();
      foreach (var specimentMovements in movementsDictionary)
      {
        var specimentCalculationResult = SpecimenMovementsCalculator.CalculateSpecimenQuantities(specimentMovements.Key, specimentMovements.Value);
        movementCalculations.Add(specimentCalculationResult);
      }

      await ProcessSpecimenDataAsync(movementCalculations);
    }

    public async Task FixPlacementsNotInZoo()
    {
      using (var connection = new SqlConnection(_connectionString))
      {
        await connection.OpenAsync();
        using (var transaction = connection.BeginTransaction())
        {
          try
          {
            var sql = @"
            UPDATE Specimens
            SET
              OrganizationLevelId = null,
              PlacementLocationId = null,
              PlacementDate  = null
            WHERE
              QuantityInZoo = 0";

            await connection.ExecuteAsync(sql, transaction: transaction, commandTimeout: 0);
          }
          catch (Exception ex)
          {
            transaction.Rollback();
            Console.WriteLine($"Error Updating Specimen Calculations: {ex.Message}");
            throw;
          }
        }
      }
    }

    private async Task<Dictionary<int, List<Movement>>> LoadMovementsAsync()
    {
      using var connection = new SqlConnection(_connectionString);
      await connection.OpenAsync();

      var movements = (await connection.QueryAsync<Movement>(@"SELECT SpecimenId, Date, Quantity, QuantityActual, IncrementReason AS IncrementReasonCode, DecrementReason AS DecrementReasonCode FROM [dbo].[Movements] WITH (NOLOCK);", commandTimeout: 0)).ToList();

      var movementDict = movements
          .GroupBy(m => m.SpecimenId)
          .ToDictionary(g => g.Key, g => g.ToList());

      Console.WriteLine($"Loaded {movements.Count} movements for {movementDict.Count} unique specimens.");
      return movementDict;
    }

    private async Task ProcessSpecimenDataAsync(List<SpecimenCalculationResult> calculatedData)
    {
      using (var connection = new SqlConnection(_connectionString))
      {
        await connection.OpenAsync();
        using (var transaction = connection.BeginTransaction())
        {
          try
          {
            await CreateSpecimenDataCalculationsAsync(connection, transaction);

            await connection.ExecuteAsync("TRUNCATE TABLE [dbo].[SpecimenDataCalculations]", transaction: transaction);

            await BulkInsertStagingTableAsync(calculatedData, connection, transaction);
            await UpdateSpecimenDataAsync(connection, transaction);

            await connection.ExecuteAsync(@"

                            UPDATE sp
                            SET 
                                sp.QuantityOwned = COALESCE(agg.SumQuantityOwned, 0),
                                sp.QuantityInZoo = COALESCE(agg.SumQuantityInZoo, 0),
                                sp.QuantityDeponatedFrom = COALESCE(agg.SumQuantityDeponatedFrom, 0),
                                sp.QuantityDeponatedTo = COALESCE(agg.SumQuantityDeponatedTo, 0)
                            FROM Species sp
                            LEFT JOIN (
                                SELECT
                                    s.SpeciesId,
                                    SUM(s.QuantityOwned) AS SumQuantityOwned,
                                    SUM(s.QuantityInZoo) AS SumQuantityInZoo,
                                    SUM(s.QuantityDeponatedFrom) AS SumQuantityDeponatedFrom,
                                    SUM(s.QuantityDeponatedTo) AS SumQuantityDeponatedTo
                                FROM Specimens s
                                GROUP BY s.SpeciesId
                            ) AS agg ON sp.Id = agg.SpeciesId;

                            UPDATE g
                            SET 
                                g.QuantityOwned = COALESCE(agg.SumQuantityOwned, 0),
                                g.QuantityInZoo = COALESCE(agg.SumQuantityInZoo, 0),
                                g.QuantityDeponatedFrom = COALESCE(agg.SumQuantityDeponatedFrom, 0),
                                g.QuantityDeponatedTo = COALESCE(agg.SumQuantityDeponatedTo, 0)
                            FROM TaxonomyGenera g
                            LEFT JOIN (
                                SELECT
                                    sp.TaxonomyGenusId,
                                    SUM(sp.QuantityOwned) AS SumQuantityOwned,
                                    SUM(sp.QuantityInZoo) AS SumQuantityInZoo,
                                    SUM(sp.QuantityDeponatedFrom) AS SumQuantityDeponatedFrom,
                                    SUM(sp.QuantityDeponatedTo) AS SumQuantityDeponatedTo
                                FROM Species sp
                                GROUP BY sp.TaxonomyGenusId
                            ) AS agg ON g.Id = agg.TaxonomyGenusId;

                            UPDATE f
                            SET 
                                f.QuantityOwned = COALESCE(agg.SumQuantityOwned, 0),
                                f.QuantityInZoo = COALESCE(agg.SumQuantityInZoo, 0),
                                f.QuantityDeponatedFrom = COALESCE(agg.SumQuantityDeponatedFrom, 0),
                                f.QuantityDeponatedTo = COALESCE(agg.SumQuantityDeponatedTo, 0)
                            FROM TaxonomyFamilies f
                            LEFT JOIN (
                                SELECT
                                    g.TaxonomyFamilyId,
                                    SUM(g.QuantityOwned) AS SumQuantityOwned,
                                    SUM(g.QuantityInZoo) AS SumQuantityInZoo,
                                    SUM(g.QuantityDeponatedFrom) AS SumQuantityDeponatedFrom,
                                    SUM(g.QuantityDeponatedTo) AS SumQuantityDeponatedTo
                                FROM TaxonomyGenera g
                                GROUP BY g.TaxonomyFamilyId
                            ) AS agg ON f.Id = agg.TaxonomyFamilyId;
                    
                            UPDATE g
                            SET 
                                g.QuantityOwned = COALESCE((SELECT SUM(sp.QuantityOwned) FROM Species sp WHERE sp.TaxonomyGenusId = g.Id), 0),
                                g.QuantityInZoo = COALESCE((SELECT SUM(sp.QuantityInZoo) FROM Species sp WHERE sp.TaxonomyGenusId = g.Id), 0),
                                g.QuantityDeponatedFrom = COALESCE((SELECT SUM(sp.QuantityDeponatedFrom) FROM Species sp WHERE sp.TaxonomyGenusId = g.Id), 0),
                                g.QuantityDeponatedTo = COALESCE((SELECT SUM(sp.QuantityDeponatedTo) FROM Species sp WHERE sp.TaxonomyGenusId = g.Id), 0)
                            FROM TaxonomyGenera g;
                    
                            UPDATE o
                            SET 
                                o.QuantityOwned = COALESCE(agg.SumQuantityOwned, 0),
                                o.QuantityInZoo = COALESCE(agg.SumQuantityInZoo, 0),
                                o.QuantityDeponatedFrom = COALESCE(agg.SumQuantityDeponatedFrom, 0),
                                o.QuantityDeponatedTo = COALESCE(agg.SumQuantityDeponatedTo, 0)
                            FROM TaxonomyOrders o
                            LEFT JOIN (
                                SELECT
                                    f.TaxonomyOrderId,
                                    SUM(f.QuantityOwned) AS SumQuantityOwned,
                                    SUM(f.QuantityInZoo) AS SumQuantityInZoo,
                                    SUM(f.QuantityDeponatedFrom) AS SumQuantityDeponatedFrom,
                                    SUM(f.QuantityDeponatedTo) AS SumQuantityDeponatedTo
                                FROM TaxonomyFamilies f
                                GROUP BY f.TaxonomyOrderId
                            ) AS agg ON o.Id = agg.TaxonomyOrderId;
                    
                            UPDATE c
                            SET 
                                c.QuantityOwned = COALESCE(agg.SumQuantityOwned, 0),
                                c.QuantityInZoo = COALESCE(agg.SumQuantityInZoo, 0),
                                c.QuantityDeponatedFrom = COALESCE(agg.SumQuantityDeponatedFrom, 0),
                                c.QuantityDeponatedTo = COALESCE(agg.SumQuantityDeponatedTo, 0)
                            FROM TaxonomyClasses c
                            LEFT JOIN (
                                SELECT
                                    o.TaxonomyClassId,
                                    SUM(o.QuantityOwned) AS SumQuantityOwned,
                                    SUM(o.QuantityInZoo) AS SumQuantityInZoo,
                                    SUM(o.QuantityDeponatedFrom) AS SumQuantityDeponatedFrom,
                                    SUM(o.QuantityDeponatedTo) AS SumQuantityDeponatedTo
                                FROM TaxonomyOrders o
                                GROUP BY o.TaxonomyClassId
                            ) AS agg ON c.Id = agg.TaxonomyClassId;

                            UPDATE p
                            SET 
                                p.QuantityOwned = COALESCE(agg.SumQuantityOwned, 0),
                                p.QuantityInZoo = COALESCE(agg.SumQuantityInZoo, 0),
                                p.QuantityDeponatedFrom = COALESCE(agg.SumQuantityDeponatedFrom, 0),
                                p.QuantityDeponatedTo = COALESCE(agg.SumQuantityDeponatedTo, 0)
                            FROM TaxonomyPhyla p
                            LEFT JOIN (
                                SELECT
                                    c.TaxonomyPhylumId,
                                    SUM(c.QuantityOwned) AS SumQuantityOwned,
                                    SUM(c.QuantityInZoo) AS SumQuantityInZoo,
                                    SUM(c.QuantityDeponatedFrom) AS SumQuantityDeponatedFrom,
                                    SUM(c.QuantityDeponatedTo) AS SumQuantityDeponatedTo
                                FROM TaxonomyClasses c
                                GROUP BY c.TaxonomyPhylumId
                            ) AS agg ON p.Id = agg.TaxonomyPhylumId;
                        ", transaction: transaction, commandTimeout: 0);

            await connection.ExecuteAsync(@"
                            -- Step 1: Update Species based on actual specimen existence
                            UPDATE s
                            SET s.ZooStatus =
                                CASE
                                    WHEN s.QuantityInZoo > 0 THEN 'Z'
                                    WHEN s.QuantityDeponatedTo > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            FROM Species s
                            WHERE EXISTS (SELECT 1 FROM Specimens sp WHERE sp.SpeciesId = s.Id);

                            -- Step 2: Update Genera if any related Species has a status other than 'N'
                            UPDATE g
                            SET g.ZooStatus =
                                CASE
                                    WHEN g.QuantityInZoo > 0 THEN 'Z'
                                    WHEN g.QuantityDeponatedTo > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            FROM TaxonomyGenera g
                            WHERE EXISTS (SELECT 1 FROM Species s WHERE s.TaxonomyGenusId = g.Id AND s.ZooStatus <> 'N');

                            -- Step 3: Update Families if any related Genera has a status other than 'N'
                            UPDATE f
                            SET f.ZooStatus =
                                CASE
                                    WHEN f.QuantityInZoo > 0 THEN 'Z'
                                    WHEN f.QuantityDeponatedTo > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            FROM TaxonomyFamilies f
                            WHERE EXISTS (SELECT 1 FROM TaxonomyGenera g WHERE g.TaxonomyFamilyId = f.Id AND g.ZooStatus <> 'N');

                            -- Step 4: Update Orders if any related Families has a status other than 'N'
                            UPDATE o
                            SET o.ZooStatus =
                                CASE
                                    WHEN o.QuantityInZoo > 0 THEN 'Z'
                                    WHEN o.QuantityDeponatedTo > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            FROM TaxonomyOrders o
                            WHERE EXISTS (SELECT 1 FROM TaxonomyFamilies f WHERE f.TaxonomyOrderId = o.Id AND f.ZooStatus <> 'N');

                            -- Step 5: Update Classes if any related Orders has a status other than 'N'
                            UPDATE c
                            SET c.ZooStatus =
                                CASE
                                    WHEN c.QuantityInZoo > 0 THEN 'Z'
                                    WHEN c.QuantityDeponatedTo > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            FROM TaxonomyClasses c
                            WHERE EXISTS (SELECT 1 FROM TaxonomyOrders o WHERE o.TaxonomyClassId = c.Id AND o.ZooStatus <> 'N');

                             -- Step 6: Update Phyla if any related Class has a status other than 'N'
                            UPDATE c
                            SET c.ZooStatus =
                                CASE
                                    WHEN c.QuantityInZoo > 0 THEN 'Z'
                                    WHEN c.QuantityDeponatedTo > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            FROM TaxonomyPhyla c
                            WHERE EXISTS (SELECT 1 FROM TaxonomyClasses o WHERE o.TaxonomyPhylumId = c.Id AND o.ZooStatus <> 'N');
                        ", transaction: transaction, commandTimeout: 0);

            await connection.ExecuteAsync("DROP TABLE IF EXISTS [dbo].[SpecimenDataCalculations];", transaction: transaction);

            transaction.Commit();

            Console.WriteLine("Specimen Calculations Updated Successfully!");
          }
          catch (Exception ex)
          {
            transaction.Rollback();
            Console.WriteLine($"Error Updating Specimen Calculations: {ex.Message}");
            throw;
          }
        }
      }
    }

    private async Task BulkInsertStagingTableAsync(IEnumerable<SpecimenCalculationResult> data, SqlConnection connection, SqlTransaction transaction)
    {
      using var bulkCopy = new SqlBulkCopy(connection, SqlBulkCopyOptions.TableLock, transaction);
      bulkCopy.DestinationTableName = "SpecimenDataCalculations";
      bulkCopy.BatchSize = 5000;
      bulkCopy.BulkCopyTimeout = 0;

      using var dataToImport = data.ToDataTable();

      // NOTE: Bulk copy behavior is unpredictable (e.g. identity insert, typo..) so we will rather map columns manually.
      bulkCopy.ColumnMappings.Add("SpecimenId", "SpecimenId");
      bulkCopy.ColumnMappings.Add("QuantityOwned", "QuantityOwned");
      bulkCopy.ColumnMappings.Add("QuantityInZoo", "QuantityInZoo");
      bulkCopy.ColumnMappings.Add("QuantityDeponatedFrom", "QuantityDeponatedFrom");
      bulkCopy.ColumnMappings.Add("QuantityDeponatedTo", "QuantityDeponatedTo");

      await bulkCopy.WriteToServerAsync(dataToImport);
    }

    private static async Task UpdateSpecimenDataAsync(SqlConnection connection, SqlTransaction transaction)
    {
      var sql = @"
                UPDATE s
                SET 
                    s.QuantityOwned = t.QuantityOwned,
                    s.QuantityInZoo = t.QuantityInZoo,
                    s.QuantityDeponatedFrom = t.QuantityDeponatedFrom,
                    s.QuantityDeponatedTo = t.QuantityDeponatedTo
                FROM Specimens s
                INNER JOIN SpecimenDataCalculations t ON s.Id = t.SpecimenId;";

      await connection.ExecuteAsync(sql, transaction: transaction, commandTimeout: 0);
    }

    private static async Task CreateSpecimenDataCalculationsAsync(SqlConnection connection, SqlTransaction transaction)
    {
      var sql = @"
           DROP TABLE IF EXISTS [dbo].[SpecimenDataCalculations];

           CREATE TABLE [dbo].[SpecimenDataCalculations] (
              [SpecimenId] INT NOT NULL PRIMARY KEY,
              [QuantityOwned] INT DEFAULT 0,
              [QuantityInZoo] INT DEFAULT 0,
              [QuantityDeponatedFrom] INT DEFAULT 0,
              [QuantityDeponatedTo] INT DEFAULT 0,
              [ZooStatus] VARCHAR(5)
          );";

      await connection.ExecuteAsync(sql, transaction: transaction);
    }
  }
}
