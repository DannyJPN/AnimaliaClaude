using Dapper;
using Npgsql;
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
      using (var connection = new NpgsqlConnection(_connectionString))
      {
        await connection.OpenAsync();
        using (var transaction = connection.BeginTransaction())
        {
          try
          {
            var sql = @"
            UPDATE ""Specimens""
            SET
              ""OrganizationLevelId"" = null,
              ""PlacementLocationId"" = null,
              ""PlacementDate""  = null
            WHERE
              ""QuantityInZoo"" = 0";

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
      using var connection = new NpgsqlConnection(_connectionString);
      await connection.OpenAsync();

      var movements = (await connection.QueryAsync<Movement>(@"SELECT \"SpecimenId\", \"Date\", \"Quantity\", \"QuantityActual\", \"IncrementReason\" AS \"IncrementReasonCode\", \"DecrementReason\" AS \"DecrementReasonCode\" FROM \"Movements\";", commandTimeout: 0)).ToList();

      var movementDict = movements
          .GroupBy(m => m.SpecimenId)
          .ToDictionary(g => g.Key, g => g.ToList());

      Console.WriteLine($"Loaded {movements.Count} movements for {movementDict.Count} unique specimens.");
      return movementDict;
    }

    private async Task ProcessSpecimenDataAsync(List<SpecimenCalculationResult> calculatedData)
    {
      using (var connection = new NpgsqlConnection(_connectionString))
      {
        await connection.OpenAsync();
        using (var transaction = connection.BeginTransaction())
        {
          try
          {
            await CreateSpecimenDataCalculationsAsync(connection, transaction);

            await connection.ExecuteAsync("TRUNCATE TABLE \"SpecimenDataCalculations\";", transaction: transaction);

            await BulkInsertStagingTableAsync(calculatedData, connection, transaction);
            await UpdateSpecimenDataAsync(connection, transaction);

            await connection.ExecuteAsync(@"
                            -- Update Species aggregations
                            UPDATE \"Species\"
                            SET
                                \"QuantityOwned\" = COALESCE(agg.\"SumQuantityOwned\", 0),
                                \"QuantityInZoo\" = COALESCE(agg.\"SumQuantityInZoo\", 0),
                                \"QuantityDeponatedFrom\" = COALESCE(agg.\"SumQuantityDeponatedFrom\", 0),
                                \"QuantityDeponatedTo\" = COALESCE(agg.\"SumQuantityDeponatedTo\", 0)
                            FROM (
                                SELECT
                                    s.\"SpeciesId\",
                                    SUM(s.\"QuantityOwned\") AS \"SumQuantityOwned\",
                                    SUM(s.\"QuantityInZoo\") AS \"SumQuantityInZoo\",
                                    SUM(s.\"QuantityDeponatedFrom\") AS \"SumQuantityDeponatedFrom\",
                                    SUM(s.\"QuantityDeponatedTo\") AS \"SumQuantityDeponatedTo\"
                                FROM \"Specimens\" s
                                GROUP BY s.\"SpeciesId\"
                            ) AS agg
                            WHERE \"Species\".\"Id\" = agg.\"SpeciesId\";

                            -- Update TaxonomyGenera aggregations
                            UPDATE \"TaxonomyGenera\"
                            SET
                                \"QuantityOwned\" = COALESCE(agg.\"SumQuantityOwned\", 0),
                                \"QuantityInZoo\" = COALESCE(agg.\"SumQuantityInZoo\", 0),
                                \"QuantityDeponatedFrom\" = COALESCE(agg.\"SumQuantityDeponatedFrom\", 0),
                                \"QuantityDeponatedTo\" = COALESCE(agg.\"SumQuantityDeponatedTo\", 0)
                            FROM (
                                SELECT
                                    sp.\"TaxonomyGenusId\",
                                    SUM(sp.\"QuantityOwned\") AS \"SumQuantityOwned\",
                                    SUM(sp.\"QuantityInZoo\") AS \"SumQuantityInZoo\",
                                    SUM(sp.\"QuantityDeponatedFrom\") AS \"SumQuantityDeponatedFrom\",
                                    SUM(sp.\"QuantityDeponatedTo\") AS \"SumQuantityDeponatedTo\"
                                FROM \"Species\" sp
                                GROUP BY sp.\"TaxonomyGenusId\"
                            ) AS agg
                            WHERE \"TaxonomyGenera\".\"Id\" = agg.\"TaxonomyGenusId\";

                            -- Update TaxonomyFamilies aggregations
                            UPDATE \"TaxonomyFamilies\"
                            SET
                                \"QuantityOwned\" = COALESCE(agg.\"SumQuantityOwned\", 0),
                                \"QuantityInZoo\" = COALESCE(agg.\"SumQuantityInZoo\", 0),
                                \"QuantityDeponatedFrom\" = COALESCE(agg.\"SumQuantityDeponatedFrom\", 0),
                                \"QuantityDeponatedTo\" = COALESCE(agg.\"SumQuantityDeponatedTo\", 0)
                            FROM (
                                SELECT
                                    g.\"TaxonomyFamilyId\",
                                    SUM(g.\"QuantityOwned\") AS \"SumQuantityOwned\",
                                    SUM(g.\"QuantityInZoo\") AS \"SumQuantityInZoo\",
                                    SUM(g.\"QuantityDeponatedFrom\") AS \"SumQuantityDeponatedFrom\",
                                    SUM(g.\"QuantityDeponatedTo\") AS \"SumQuantityDeponatedTo\"
                                FROM \"TaxonomyGenera\" g
                                GROUP BY g.\"TaxonomyFamilyId\"
                            ) AS agg
                            WHERE \"TaxonomyFamilies\".\"Id\" = agg.\"TaxonomyFamilyId\";

                            -- Update TaxonomyOrders aggregations
                            UPDATE \"TaxonomyOrders\"
                            SET
                                \"QuantityOwned\" = COALESCE(agg.\"SumQuantityOwned\", 0),
                                \"QuantityInZoo\" = COALESCE(agg.\"SumQuantityInZoo\", 0),
                                \"QuantityDeponatedFrom\" = COALESCE(agg.\"SumQuantityDeponatedFrom\", 0),
                                \"QuantityDeponatedTo\" = COALESCE(agg.\"SumQuantityDeponatedTo\", 0)
                            FROM (
                                SELECT
                                    f.\"TaxonomyOrderId\",
                                    SUM(f.\"QuantityOwned\") AS \"SumQuantityOwned\",
                                    SUM(f.\"QuantityInZoo\") AS \"SumQuantityInZoo\",
                                    SUM(f.\"QuantityDeponatedFrom\") AS \"SumQuantityDeponatedFrom\",
                                    SUM(f.\"QuantityDeponatedTo\") AS \"SumQuantityDeponatedTo\"
                                FROM \"TaxonomyFamilies\" f
                                GROUP BY f.\"TaxonomyOrderId\"
                            ) AS agg
                            WHERE \"TaxonomyOrders\".\"Id\" = agg.\"TaxonomyOrderId\";

                            -- Update TaxonomyClasses aggregations
                            UPDATE \"TaxonomyClasses\"
                            SET
                                \"QuantityOwned\" = COALESCE(agg.\"SumQuantityOwned\", 0),
                                \"QuantityInZoo\" = COALESCE(agg.\"SumQuantityInZoo\", 0),
                                \"QuantityDeponatedFrom\" = COALESCE(agg.\"SumQuantityDeponatedFrom\", 0),
                                \"QuantityDeponatedTo\" = COALESCE(agg.\"SumQuantityDeponatedTo\", 0)
                            FROM (
                                SELECT
                                    o.\"TaxonomyClassId\",
                                    SUM(o.\"QuantityOwned\") AS \"SumQuantityOwned\",
                                    SUM(o.\"QuantityInZoo\") AS \"SumQuantityInZoo\",
                                    SUM(o.\"QuantityDeponatedFrom\") AS \"SumQuantityDeponatedFrom\",
                                    SUM(o.\"QuantityDeponatedTo\") AS \"SumQuantityDeponatedTo\"
                                FROM \"TaxonomyOrders\" o
                                GROUP BY o.\"TaxonomyClassId\"
                            ) AS agg
                            WHERE \"TaxonomyClasses\".\"Id\" = agg.\"TaxonomyClassId\";

                            -- Update TaxonomyPhyla aggregations
                            UPDATE \"TaxonomyPhyla\"
                            SET
                                \"QuantityOwned\" = COALESCE(agg.\"SumQuantityOwned\", 0),
                                \"QuantityInZoo\" = COALESCE(agg.\"SumQuantityInZoo\", 0),
                                \"QuantityDeponatedFrom\" = COALESCE(agg.\"SumQuantityDeponatedFrom\", 0),
                                \"QuantityDeponatedTo\" = COALESCE(agg.\"SumQuantityDeponatedTo\", 0)
                            FROM (
                                SELECT
                                    c.\"TaxonomyPhylumId\",
                                    SUM(c.\"QuantityOwned\") AS \"SumQuantityOwned\",
                                    SUM(c.\"QuantityInZoo\") AS \"SumQuantityInZoo\",
                                    SUM(c.\"QuantityDeponatedFrom\") AS \"SumQuantityDeponatedFrom\",
                                    SUM(c.\"QuantityDeponatedTo\") AS \"SumQuantityDeponatedTo\"
                                FROM \"TaxonomyClasses\" c
                                GROUP BY c.\"TaxonomyPhylumId\"
                            ) AS agg
                            WHERE \"TaxonomyPhyla\".\"Id\" = agg.\"TaxonomyPhylumId\";
                        ", transaction: transaction, commandTimeout: 0);

            await connection.ExecuteAsync(@"
                            -- Step 1: Update Species based on actual specimen existence
                            UPDATE \"Species\"
                            SET \"ZooStatus\" =
                                CASE
                                    WHEN \"QuantityInZoo\" > 0 THEN 'Z'
                                    WHEN \"QuantityDeponatedTo\" > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            WHERE EXISTS (SELECT 1 FROM \"Specimens\" sp WHERE sp.\"SpeciesId\" = \"Species\".\"Id\");

                            -- Step 2: Update Genera if any related Species has a status other than 'N'
                            UPDATE \"TaxonomyGenera\"
                            SET \"ZooStatus\" =
                                CASE
                                    WHEN \"QuantityInZoo\" > 0 THEN 'Z'
                                    WHEN \"QuantityDeponatedTo\" > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            WHERE EXISTS (SELECT 1 FROM \"Species\" s WHERE s.\"TaxonomyGenusId\" = \"TaxonomyGenera\".\"Id\" AND s.\"ZooStatus\" <> 'N');

                            -- Step 3: Update Families if any related Genera has a status other than 'N'
                            UPDATE \"TaxonomyFamilies\"
                            SET \"ZooStatus\" =
                                CASE
                                    WHEN \"QuantityInZoo\" > 0 THEN 'Z'
                                    WHEN \"QuantityDeponatedTo\" > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            WHERE EXISTS (SELECT 1 FROM \"TaxonomyGenera\" g WHERE g.\"TaxonomyFamilyId\" = \"TaxonomyFamilies\".\"Id\" AND g.\"ZooStatus\" <> 'N');

                            -- Step 4: Update Orders if any related Families has a status other than 'N'
                            UPDATE \"TaxonomyOrders\"
                            SET \"ZooStatus\" =
                                CASE
                                    WHEN \"QuantityInZoo\" > 0 THEN 'Z'
                                    WHEN \"QuantityDeponatedTo\" > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            WHERE EXISTS (SELECT 1 FROM \"TaxonomyFamilies\" f WHERE f.\"TaxonomyOrderId\" = \"TaxonomyOrders\".\"Id\" AND f.\"ZooStatus\" <> 'N');

                            -- Step 5: Update Classes if any related Orders has a status other than 'N'
                            UPDATE \"TaxonomyClasses\"
                            SET \"ZooStatus\" =
                                CASE
                                    WHEN \"QuantityInZoo\" > 0 THEN 'Z'
                                    WHEN \"QuantityDeponatedTo\" > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            WHERE EXISTS (SELECT 1 FROM \"TaxonomyOrders\" o WHERE o.\"TaxonomyClassId\" = \"TaxonomyClasses\".\"Id\" AND o.\"ZooStatus\" <> 'N');

                             -- Step 6: Update Phyla if any related Class has a status other than 'N'
                            UPDATE \"TaxonomyPhyla\"
                            SET \"ZooStatus\" =
                                CASE
                                    WHEN \"QuantityInZoo\" > 0 THEN 'Z'
                                    WHEN \"QuantityDeponatedTo\" > 0 THEN 'D'
                                    ELSE 'A'
                                END
                            WHERE EXISTS (SELECT 1 FROM \"TaxonomyClasses\" o WHERE o.\"TaxonomyPhylumId\" = \"TaxonomyPhyla\".\"Id\" AND o.\"ZooStatus\" <> 'N');
                        ", transaction: transaction, commandTimeout: 0);

            await connection.ExecuteAsync("DROP TABLE IF EXISTS \"SpecimenDataCalculations\";", transaction: transaction);

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

    private async Task BulkInsertStagingTableAsync(IEnumerable<SpecimenCalculationResult> data, NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
      // Use PostgreSQL COPY command for bulk insert
      var copyCommand = "COPY \"SpecimenDataCalculations\" (\"SpecimenId\", \"QuantityOwned\", \"QuantityInZoo\", \"QuantityDeponatedFrom\", \"QuantityDeponatedTo\") FROM STDIN WITH (FORMAT CSV)";

      await using var writer = await connection.BeginTextImportAsync(copyCommand);

      foreach (var row in data)
      {
        var values = new List<string>
        {
          row.SpecimenId.ToString(),
          row.QuantityOwned.ToString(),
          row.QuantityInZoo.ToString(),
          row.QuantityDeponatedFrom.ToString(),
          row.QuantityDeponatedTo.ToString()
        };

        await writer.WriteLineAsync(string.Join(",", values));
      }

      await writer.FlushAsync();
    }

    private static async Task UpdateSpecimenDataAsync(NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
      var sql = @"
                UPDATE \"Specimens\"
                SET
                    \"QuantityOwned\" = t.\"QuantityOwned\",
                    \"QuantityInZoo\" = t.\"QuantityInZoo\",
                    \"QuantityDeponatedFrom\" = t.\"QuantityDeponatedFrom\",
                    \"QuantityDeponatedTo\" = t.\"QuantityDeponatedTo\"
                FROM \"SpecimenDataCalculations\" t
                WHERE \"Specimens\".\"Id\" = t.\"SpecimenId\";";

      await connection.ExecuteAsync(sql, transaction: transaction, commandTimeout: 0);
    }

    private static async Task CreateSpecimenDataCalculationsAsync(NpgsqlConnection connection, NpgsqlTransaction transaction)
    {
      var sql = @"
           DROP TABLE IF EXISTS \"SpecimenDataCalculations\";

           CREATE TEMP TABLE \"SpecimenDataCalculations\" (
              \"SpecimenId\" INTEGER NOT NULL PRIMARY KEY,
              \"QuantityOwned\" INTEGER DEFAULT 0,
              \"QuantityInZoo\" INTEGER DEFAULT 0,
              \"QuantityDeponatedFrom\" INTEGER DEFAULT 0,
              \"QuantityDeponatedTo\" INTEGER DEFAULT 0,
              \"ZooStatus\" VARCHAR(5)
          );";

      await connection.ExecuteAsync(sql, transaction: transaction);
    }
  }
}
