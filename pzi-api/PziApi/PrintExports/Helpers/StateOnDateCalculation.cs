using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;
using PziApi.Models;

public class StateOnDateCalculation
{
  public record SpecimenStateOnDate(int Id, QuantityCalculations.CalculatedCounts Quantities, Movement? FirstIn, Movement? LastOut, IEnumerable<Movement> Movements);

  public static async Task<(Dictionary<int, SpecimenStateOnDate> acceptedSpecimensCache, IEnumerable<int> acceptedSpecimenIds)> CalculateSpecimensStateOnDate(
    PziDbContext dbContext,
    string asOfDate,
    Func<QuantityCalculations.CalculatedCounts, IEnumerable<Movement>, bool> acceptCallback)
  {
    return await StateOnDateCalculation.CalculateSpecimensStateOnDate(dbContext, asOfDate, (query) => query, acceptCallback);
  }

  public static async Task<(Dictionary<int, SpecimenStateOnDate> acceptedSpecimensCache, IEnumerable<int> acceptedSpecimenIds)> CalculateSpecimensStateOnDate(
    PziDbContext dbContext,
    string asOfDate,
    Func<IQueryable<Movement>, IQueryable<Movement>> additionalFilter,
    Func<QuantityCalculations.CalculatedCounts, IEnumerable<Movement>, bool> acceptCallback
  )
  {
    var specimensQuantitiesCache = new Dictionary<int, SpecimenStateOnDate>();
    var specimenIdsCache = new List<int>();

    var batchSize = 7500;
    var currentBatchNumber = 0;
    var movementsFromPreviousBatch = new List<Movement>();

    while (true)
    {
      var basicMovementsBatch = dbContext.Movements.AsNoTracking()
                  .Include(m => m.Partner)
                  .Where(m => string.Compare(m.Date, asOfDate) <= 0);

      var movementsBatch = await additionalFilter(basicMovementsBatch)
            .OrderBy(m => m.SpecimenId)
              .ThenBy(m => m.Id)
            .Skip(currentBatchNumber * batchSize)
            .Take(batchSize)
            .ToArrayAsync();

      var movementsBySpecimen = movementsBatch
            .GroupBy(m => m.SpecimenId)
            .Select(mg =>
            {
              return mg.ToList();
            })
            .ToList();

      if (movementsFromPreviousBatch.Count > 0)
      {
        if (movementsBySpecimen.FirstOrDefault()?.FirstOrDefault()?.SpecimenId == movementsFromPreviousBatch.First().SpecimenId)
        {
          movementsBySpecimen.First().AddRange(movementsFromPreviousBatch);
        }
        else
        {
          movementsBySpecimen.Insert(0, movementsFromPreviousBatch);
        }
      }

      if (movementsBySpecimen.Count > 1)
      {
        movementsFromPreviousBatch = movementsBySpecimen.Last();
        movementsBySpecimen.RemoveAt(movementsBySpecimen.Count - 1);
      }
      else
      {
        movementsFromPreviousBatch = new List<Movement>();
      }

      foreach (var specimenMovements in movementsBySpecimen)
      {
        var specimenQuantities = QuantityCalculations.CalculateSpecimenQuantitiesFromMovements(specimenMovements.ToArray());

        var addToResult = acceptCallback(specimenQuantities, specimenMovements);
        if (addToResult)
        {
          var specimenId = specimenMovements.First().SpecimenId;

          var firstInMovement = specimenMovements.FirstOrDefault(m => !string.IsNullOrEmpty(m.IncrementReasonCode));
          var lastOutMovement = specimenMovements.LastOrDefault(m => !string.IsNullOrEmpty(m.DecrementReasonCode));

          specimensQuantitiesCache[specimenId] = new SpecimenStateOnDate(specimenId, specimenQuantities, firstInMovement, lastOutMovement, specimenMovements);
          specimenIdsCache.Add(specimenId);
        }
      }

      if (movementsBatch.Length < batchSize)
      {
        if (movementsFromPreviousBatch.Count > 0)
        {
          var specimenQuantities = QuantityCalculations.CalculateSpecimenQuantitiesFromMovements(movementsFromPreviousBatch.ToArray());

          var addToResult = acceptCallback(specimenQuantities, movementsFromPreviousBatch);
          if (addToResult)
          {
            var specimenId = movementsFromPreviousBatch.First().SpecimenId;

            var firstInMovement = movementsFromPreviousBatch.FirstOrDefault(m => !string.IsNullOrEmpty(m.IncrementReasonCode));
            var lastOutMovement = movementsFromPreviousBatch.LastOrDefault(m => !string.IsNullOrEmpty(m.DecrementReasonCode));

            specimensQuantitiesCache[specimenId] = new SpecimenStateOnDate(specimenId, specimenQuantities, firstInMovement, lastOutMovement, movementsFromPreviousBatch);
            specimenIdsCache.Add(specimenId);
          }
        }

        break;
      }

      currentBatchNumber += 1;
    }

    return (specimensQuantitiesCache, specimenIdsCache);
  }
}
