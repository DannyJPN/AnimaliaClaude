using Pzi.Data.Import.Services.Entities;
using System.Data;

namespace Pzi.Data.Import.Services
{
  public class SpecimenMovementsCalculator
  {
    public const string IN_DEPONATED_FROM_CODE = "IN05";
    public const string IN_DEPONATE_BORN = "IN07";
    public const string OUT_DEPONATED_TO_CODE = "OUT05";
    public static readonly string[] DEPONATE_FROM_DECREASES = [
      "IN03", "IN04", "IN08", "IN10", "IN11", "IN50",
    "OUT01", "OUT02", "OUT04", "OUT05", "OUT06", "OUT07", "OUT08", "OUT09", "OUT10", "OUT11", "OUT12", "OUT13",
    "OUT14", "OUT15", "OUT16", "OUT17", "OUT18", "OUT20", "OUT21", "OUT22", "OUT23", "OUT50"
    ];
    public static readonly string[] DEPONATE_FROM_INCREASES = ["IN13"];
    public static readonly string[] DEPONATE_TO_DECREASES = [
      "IN06",
    "OUT01", "OUT03", "OUT04", "OUT07", "OUT09", "OUT10", "OUT11", "OUT12", "OUT13",
    "OUT14", "OUT15", "OUT16", "OUT17", "OUT18", "OUT20", "OUT21", "OUT22", "OUT23", "OUT50"
    ];
    public static readonly string[] DEPONATE_TO_INCREASES = [];

    private record CalculatedCounts(int QuantityOwned, int QuantityInZoo, int QuantityDeponatedFrom, int QuantityDeponatedTo);

    public static SpecimenCalculationResult CalculateSpecimenQuantities(int specimenId, List<Movement> allSpecimenMovements)
    {
      var quantities = CalculateSpecimenQuantitiesFromMovements(allSpecimenMovements);
      return new SpecimenCalculationResult(
          specimenId,
          quantities.QuantityOwned,
          quantities.QuantityInZoo,
          quantities.QuantityDeponatedFrom,
          quantities.QuantityDeponatedTo);
    }

    private static string CalculateZooStatusFromQuantities(int inZoo, int deponatedTo)
    {
      return inZoo > 0
        ? "Z"
        : deponatedTo > 0
          ? "D"
          : "A";
    }

    private static CalculatedCounts CalculateSpecimenQuantitiesFromMovements(List<Movement> movements)
    {
      var inZooCount = 0;

      var deponatedFromCount = 0;
      var deponatedToCount = 0;
      var deponatedFrom = false;
      var deponatedTo = false;

    var sortedMovements = movements
          .OrderBy(m => m.Date)
          .ThenBy(m => m.IncrementReasonCode != null ? m.IncrementReasonCode : m.DecrementReasonCode).ToArray();

      foreach (var movement in sortedMovements)
      {
        if (!string.IsNullOrEmpty(movement.IncrementReasonCode))
        {
          inZooCount += movement.Quantity;

          if (movement.IncrementReasonCode == IN_DEPONATED_FROM_CODE)
          {
            deponatedFromCount = movement.QuantityActual;
            deponatedFrom = true;
          }

          if (deponatedFrom)
          {
            if (DEPONATE_FROM_DECREASES.Contains(movement.IncrementReasonCode))
            {
              deponatedFromCount -= movement.QuantityActual;
            }

            if (DEPONATE_FROM_INCREASES.Contains(movement.IncrementReasonCode))
            {
              deponatedFromCount += movement.QuantityActual;

            }
          }

          if (deponatedTo)
          {
            if (DEPONATE_TO_DECREASES.Contains(movement.IncrementReasonCode))
            {
              deponatedToCount -= movement.QuantityActual;
            }

            if (DEPONATE_TO_INCREASES.Contains(movement.IncrementReasonCode))
            {
              deponatedToCount += movement.QuantityActual;
            }
          }
        }

        if (!string.IsNullOrEmpty(movement.DecrementReasonCode))
        {
          inZooCount -= movement.Quantity;

          if (movement.DecrementReasonCode == OUT_DEPONATED_TO_CODE)
          {
            deponatedToCount = movement.QuantityActual;
            deponatedTo = true;
          }

          if (deponatedFrom)
          {
            if (DEPONATE_FROM_DECREASES.Contains(movement.DecrementReasonCode))
            {
              deponatedFromCount -= movement.QuantityActual;
            }

            if (DEPONATE_FROM_INCREASES.Contains(movement.DecrementReasonCode))
            {
              deponatedFromCount += movement.QuantityActual;
            }
          }

          if (deponatedTo)
          {
            if (DEPONATE_TO_DECREASES.Contains(movement.DecrementReasonCode))
            {
              deponatedToCount -= movement.QuantityActual;
            }

            if (DEPONATE_TO_INCREASES.Contains(movement.DecrementReasonCode))
            {
              deponatedToCount += movement.QuantityActual;
            }
          }
        }
      }

      var ownedCount = inZooCount - deponatedFromCount + deponatedToCount;

      return new CalculatedCounts(ownedCount, inZooCount, deponatedFromCount, deponatedToCount);
    }
  }
}
