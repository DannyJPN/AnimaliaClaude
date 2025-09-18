using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.CrossCutting.Movements;

public class QuantityCalculations
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

  public class CalculatedCounts
  {
    public int QuantityOwned { get; set; }
    public int QuantityInZoo { get; set; }
    public int QuantityDeponatedFrom { get; set; }
    public int QuantityDeponatedTo { get; set; }
  }

  // NOTE: DeponatedFrom = Increment, not owned
  public static CalculatedCounts CalculateSpecimenQuantitiesFromMovements(Movement[] movements)
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

    return new CalculatedCounts
    {
      QuantityOwned = ownedCount,
      QuantityInZoo = inZooCount,
      QuantityDeponatedFrom = deponatedFromCount,
      QuantityDeponatedTo = deponatedToCount
    };
  }

  public static string CalculateZooStatusFromQuantities(int inZoo, int deponatedTo)
  {
    return inZoo > 0
      ? "Z"
      : deponatedTo > 0
        ? "D"
        : "A";
  }

  public static async Task<(
    CalculatedCounts speciesCounts,
    CalculatedCounts genusCounts,
    CalculatedCounts familyCounts,
    CalculatedCounts orderCounts,
    CalculatedCounts classCounts,
    CalculatedCounts phylumCounts
    )> GetDataForCalculations(PziDbContext dbContext, Specimen specimen)
  {
    var speciesCounts = await dbContext.Specimens.Where(s => s.SpeciesId == specimen.SpeciesId && s.Id != specimen.Id)
          .Select(e => new
          {
            e.SpeciesId,
            e.QuantityOwned,
            e.QuantityInZoo,
            e.QuantityDeponatedFrom,
            e.QuantityDeponatedTo
          })
          .GroupBy(s => s.SpeciesId)
          .Select(sg => new CalculatedCounts
          {
            QuantityOwned = sg.Sum(g => g.QuantityOwned),
            QuantityInZoo = sg.Sum(g => g.QuantityInZoo),
            QuantityDeponatedFrom = sg.Sum(g => g.QuantityDeponatedFrom),
            QuantityDeponatedTo = sg.Sum(g => g.QuantityDeponatedTo)
          })
          .FirstOrDefaultAsync();

    speciesCounts ??= new CalculatedCounts
    {
      QuantityOwned = 0,
      QuantityInZoo = 0,
      QuantityDeponatedFrom = 0,
      QuantityDeponatedTo = 0
    };

    var genusCounts = await dbContext.Species
          .Where(s => s.TaxonomyGenusId == specimen.Species!.TaxonomyGenusId
              && s.Id != specimen.SpeciesId)
          .Select(e => new
          {
            e.TaxonomyGenusId,
            e.QuantityOwned,
            e.QuantityInZoo,
            e.QuantityDeponatedFrom,
            e.QuantityDeponatedTo
          })
          .GroupBy(e => e.TaxonomyGenusId)
          .Select(eg => new CalculatedCounts
          {
            QuantityOwned = eg.Sum(g => g.QuantityOwned),
            QuantityInZoo = eg.Sum(g => g.QuantityInZoo),
            QuantityDeponatedFrom = eg.Sum(g => g.QuantityDeponatedFrom),
            QuantityDeponatedTo = eg.Sum(g => g.QuantityDeponatedTo)
          })
          .FirstOrDefaultAsync();

    genusCounts ??= new CalculatedCounts
    {
      QuantityOwned = 0,
      QuantityInZoo = 0,
      QuantityDeponatedFrom = 0,
      QuantityDeponatedTo = 0
    };

    var familyCounts = await dbContext.TaxonomyGenera
          .Where(e => e.TaxonomyFamilyId == specimen.Species!.TaxonomyGenus!.TaxonomyFamilyId
              && e.Id != specimen.Species.TaxonomyGenusId)
          .Select(e => new
          {
            e.TaxonomyFamilyId,
            e.QuantityOwned,
            e.QuantityInZoo,
            e.QuantityDeponatedFrom,
            e.QuantityDeponatedTo
          })
          .GroupBy(e => e.TaxonomyFamilyId)
          .Select(eg => new CalculatedCounts
          {
            QuantityOwned = eg.Sum(g => g.QuantityOwned),
            QuantityInZoo = eg.Sum(g => g.QuantityInZoo),
            QuantityDeponatedFrom = eg.Sum(g => g.QuantityDeponatedFrom),
            QuantityDeponatedTo = eg.Sum(g => g.QuantityDeponatedTo)
          })
          .FirstOrDefaultAsync();

    familyCounts ??= new CalculatedCounts
    {
      QuantityOwned = 0,
      QuantityInZoo = 0,
      QuantityDeponatedFrom = 0,
      QuantityDeponatedTo = 0
    };

    var orderCounts = await dbContext.TaxonomyFamilies
          .Where(e => e.TaxonomyOrderId == specimen.Species!.TaxonomyGenus!.TaxonomyFamilyId
              && e.Id != specimen.Species.TaxonomyGenus.TaxonomyFamilyId)
          .Select(e => new
          {
            e.TaxonomyOrderId,
            e.QuantityOwned,
            e.QuantityInZoo,
            e.QuantityDeponatedFrom,
            e.QuantityDeponatedTo
          })
          .GroupBy(e => e.TaxonomyOrderId)
          .Select(eg => new CalculatedCounts
          {
            QuantityOwned = eg.Sum(g => g.QuantityOwned),
            QuantityInZoo = eg.Sum(g => g.QuantityInZoo),
            QuantityDeponatedFrom = eg.Sum(g => g.QuantityDeponatedFrom),
            QuantityDeponatedTo = eg.Sum(g => g.QuantityDeponatedTo)
          })
          .FirstOrDefaultAsync();

    orderCounts ??= new CalculatedCounts
    {
      QuantityOwned = 0,
      QuantityInZoo = 0,
      QuantityDeponatedFrom = 0,
      QuantityDeponatedTo = 0
    };

    var classCounts = await dbContext.TaxonomyOrders
          .Where(e => e.TaxonomyClassId == specimen.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClassId
              && e.Id != specimen.Species.TaxonomyGenus.TaxonomyFamily.TaxonomyOrderId)
          .Select(e => new
          {
            e.TaxonomyClassId,
            e.QuantityOwned,
            e.QuantityInZoo,
            e.QuantityDeponatedFrom,
            e.QuantityDeponatedTo
          })
          .GroupBy(e => e.TaxonomyClassId)
          .Select(eg => new CalculatedCounts
          {
            QuantityOwned = eg.Sum(g => g.QuantityOwned),
            QuantityInZoo = eg.Sum(g => g.QuantityInZoo),
            QuantityDeponatedFrom = eg.Sum(g => g.QuantityDeponatedFrom),
            QuantityDeponatedTo = eg.Sum(g => g.QuantityDeponatedTo)
          })
          .FirstOrDefaultAsync();

    classCounts ??= new CalculatedCounts
    {
      QuantityOwned = 0,
      QuantityInZoo = 0,
      QuantityDeponatedFrom = 0,
      QuantityDeponatedTo = 0
    };

    var phylumCounts = await dbContext.TaxonomyClasses
      .Where(e => e.TaxonomyPhylumId == specimen.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylumId
          && e.Id != specimen.Species.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClassId)
      .Select(e => new
      {
        e.TaxonomyPhylumId,
        e.QuantityOwned,
        e.QuantityInZoo,
        e.QuantityDeponatedFrom,
        e.QuantityDeponatedTo
      })
      .GroupBy(e => e.TaxonomyPhylumId)
      .Select(eg => new CalculatedCounts
      {
        QuantityOwned = eg.Sum(g => g.QuantityOwned),
        QuantityInZoo = eg.Sum(g => g.QuantityInZoo),
        QuantityDeponatedFrom = eg.Sum(g => g.QuantityDeponatedFrom),
        QuantityDeponatedTo = eg.Sum(g => g.QuantityDeponatedTo)
      })
      .FirstOrDefaultAsync();

    phylumCounts ??= new CalculatedCounts
    {
      QuantityOwned = 0,
      QuantityInZoo = 0,
      QuantityDeponatedFrom = 0,
      QuantityDeponatedTo = 0
    };

    return (
      speciesCounts,
      genusCounts,
      familyCounts,
      orderCounts,
      classCounts,
      phylumCounts
    );
  }

  public static void UpdateTaxonomyValues(
    Specimen specimen,
    Movement[] allSpecimenMovements,
    CalculatedCounts speciesCounts,
    CalculatedCounts genusCounts,
    CalculatedCounts familyCounts,
    CalculatedCounts orderCounts,
    CalculatedCounts classCounts,
    CalculatedCounts phylumCounts
  )
  {
    var species = specimen.Species!;
    var genus = species.TaxonomyGenus!;
    var family = genus.TaxonomyFamily!;
    var order = family.TaxonomyOrder!;
    var taxonomyClass = order.TaxonomyClass!;
    var phylum = taxonomyClass.TaxonomyPhylum!;

    var quantities = QuantityCalculations.CalculateSpecimenQuantitiesFromMovements(allSpecimenMovements);

    var inMovement = allSpecimenMovements
          .OrderBy(mm => mm.Date)
          .FirstOrDefault(m => !string.IsNullOrEmpty(m.IncrementReasonCode));

    var outMovement = allSpecimenMovements
        .OrderByDescending(m => m.Date)
        .FirstOrDefault(m => !string.IsNullOrEmpty(m.DecrementReasonCode));

    var priceMovement = allSpecimenMovements
        .OrderByDescending(m => m.Date)
        .FirstOrDefault(m => m.Price != null);

    specimen.InDate = inMovement?.Date;
    specimen.InReasonCode = inMovement?.IncrementReasonCode;
    specimen.InLocationId = inMovement?.LocationId;
    specimen.OutDate = outMovement?.Date;
    specimen.OutReasonCode = outMovement?.DecrementReasonCode;
    specimen.OutLocationId = outMovement?.LocationId;
    specimen.Price = priceMovement?.Price;

    specimen.QuantityOwned = quantities.QuantityOwned;
    specimen.QuantityInZoo = quantities.QuantityInZoo;
    specimen.QuantityDeponatedFrom = quantities.QuantityDeponatedFrom;
    specimen.QuantityDeponatedTo = quantities.QuantityDeponatedTo;

    // CALCULATE SPECIES STATUS
    species.QuantityOwned = speciesCounts.QuantityOwned + quantities.QuantityOwned;
    species.QuantityInZoo = speciesCounts.QuantityInZoo + quantities.QuantityInZoo;
    species.QuantityDeponatedFrom = speciesCounts.QuantityDeponatedFrom + quantities.QuantityDeponatedFrom;
    species.QuantityDeponatedTo = speciesCounts.QuantityDeponatedTo + quantities.QuantityDeponatedTo;
    species!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(species.QuantityInZoo, species.QuantityDeponatedTo);

    // CALCULATE GENUS STATUS / COUNTS
    genus!.QuantityOwned = genusCounts.QuantityOwned + species!.QuantityOwned;
    genus!.QuantityInZoo = genusCounts.QuantityInZoo + species!.QuantityInZoo;
    genus!.QuantityDeponatedFrom = genusCounts.QuantityDeponatedFrom + species!.QuantityDeponatedFrom;
    genus!.QuantityDeponatedTo = genusCounts.QuantityDeponatedTo + species!.QuantityDeponatedTo;
    genus!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      genus.QuantityInZoo,
      genus.QuantityDeponatedTo
    );

    // CALCULATE FAMILY STATUS / COUNT 
    family!.QuantityOwned = familyCounts.QuantityOwned + genus!.QuantityOwned;
    family!.QuantityInZoo = familyCounts.QuantityInZoo + genus!.QuantityInZoo;
    family!.QuantityDeponatedFrom = familyCounts.QuantityDeponatedFrom + genus!.QuantityDeponatedFrom;
    family!.QuantityDeponatedTo = familyCounts.QuantityDeponatedTo + genus!.QuantityDeponatedTo;
    family!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      family!.QuantityInZoo,
      family!.QuantityDeponatedTo
    );

    // ORDER STATUS / COUNTS
    order!.QuantityOwned = orderCounts.QuantityOwned + family!.QuantityOwned;
    order!.QuantityInZoo = orderCounts.QuantityInZoo + family!.QuantityInZoo;
    order!.QuantityDeponatedFrom = orderCounts.QuantityDeponatedFrom + family!.QuantityDeponatedFrom;
    order!.QuantityDeponatedTo = orderCounts.QuantityDeponatedTo + family!.QuantityDeponatedTo;
    order!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      order!.QuantityInZoo,
      order!.QuantityDeponatedTo
    );

    // Class STATUS / counts
    taxonomyClass!.QuantityOwned = classCounts.QuantityOwned + order!.QuantityOwned;
    taxonomyClass!.QuantityInZoo = classCounts.QuantityInZoo + order!.QuantityInZoo;
    taxonomyClass!.QuantityDeponatedFrom = classCounts.QuantityDeponatedFrom + order!.QuantityDeponatedFrom;
    taxonomyClass!.QuantityDeponatedTo = classCounts.QuantityDeponatedTo + order!.QuantityDeponatedTo;
    taxonomyClass!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      taxonomyClass!.QuantityInZoo,
      taxonomyClass!.QuantityDeponatedTo
    );

    // Phylum STATUS / counts
    phylum!.QuantityOwned = phylumCounts.QuantityOwned + taxonomyClass!.QuantityOwned;
    phylum!.QuantityInZoo = phylumCounts.QuantityInZoo + taxonomyClass!.QuantityInZoo;
    phylum!.QuantityDeponatedFrom = phylumCounts.QuantityDeponatedFrom + taxonomyClass!.QuantityDeponatedFrom;
    phylum!.QuantityDeponatedTo = phylumCounts.QuantityDeponatedTo + taxonomyClass!.QuantityDeponatedTo;
    phylum!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      phylum!.QuantityInZoo,
      phylum!.QuantityDeponatedTo
    );
  }
}
