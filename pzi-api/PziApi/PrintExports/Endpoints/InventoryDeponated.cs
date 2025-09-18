using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;

namespace PziApi.PrintExports.Endpoints;

public class InventoryDeponated
{
  public class InventoryDeponatedRequest
  {
    public string Date { get; set; } = null!;
  }

  public class DeponationDto
  {
    public string Type { get; set; } = null!;  // "dep_z", "dep_do", "dep_nar"
    public string? SpeciesNameCz { get; set; } // Nazev_CZ
    public string? SpeciesNameLat { get; set; } // Nazev_LAT
    public int? AccessionNumber { get; set; } // PrirustCislo
    public int SpecimenId { get; set; }
    public string? Gender { get; set; } // Pohlavi
    public string? Arks { get; set; } // ZIMS
    public decimal? Price { get; set; } // Cena
    public string? Date { get; set; } // Datum
    public int Quantity { get; set; } // PocetR (from movement)
    public string? Location { get; set; } // Heslo (from Partner)
    public string? Note { get; set; } // Poznamka
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dictionary<string, DeponationDto[]>>>, BadRequest<string>>> Handle(
      InventoryDeponatedRequest request,
      PziDbContext dbContext)
  {
    if (string.IsNullOrEmpty(request.Date))
    {
      return TypedResults.BadRequest("Date must be provided");
    }

    var result = new Dictionary<string, DeponationDto[]>{
      { "dep_z", Array.Empty<DeponationDto>() },   // Deponace z (deponations from = increase) / deponatedFrom
      { "dep_do", Array.Empty<DeponationDto>() },  // Deponace do (deponations to = decrease) / deponatedTo
      { "dep_nar", Array.Empty<DeponationDto>() }  // Narození deponátů (born in deposition)
    };

    var (specimenDataCache, specimenIds) = await StateOnDateCalculation.CalculateSpecimensStateOnDate(dbContext, request.Date, (quantities, movements) =>
    {
      return true;
    });

    var deponatedFromIds = specimenIds
          .Where(sid =>
          {
            return specimenDataCache[sid].Quantities.QuantityDeponatedFrom > 0;
          })
          .ToArray();

    var deponatedToIds = specimenIds
          .Where(sid =>
          {
            return specimenDataCache[sid].Quantities.QuantityDeponatedTo > 0;
          })
          .ToArray();

    var deponatedBirthsIds = specimenIds
          .Where(sid =>
          {
            return specimenDataCache[sid].Quantities.QuantityInZoo > 0
                    && specimenDataCache[sid].Movements.Any(m => m.IncrementReasonCode == QuantityCalculations.IN_DEPONATE_BORN);
          })
          .ToArray();

    var deponatedFromBaseData = await dbContext.Specimens
            .Where(s => deponatedFromIds.Contains(s.Id))
            .Select(s => new
            {
              Id = s.Id,
              GenderTypeCode = s.GenderTypeCode,
              AccessionNumber = s.AccessionNumber,
              Zims = s.Zims,
              SpeciesNameLat = s.Species!.NameLat,
              SpeciesNameCz = s.Species.NameCz
            })
            .ToArrayAsync();

    var deponatedToBaseData = await dbContext.Specimens
            .Where(s => deponatedToIds.Contains(s.Id))
            .Select(s => new
            {
              Id = s.Id,
              GenderTypeCode = s.GenderTypeCode,
              AccessionNumber = s.AccessionNumber,
              Zims = s.Zims,
              SpeciesNameLat = s.Species!.NameLat,
              SpeciesNameCz = s.Species.NameCz
            })
            .ToArrayAsync();

    var deponatedBirthsBaseData = await dbContext.Specimens
          .Where(s => deponatedBirthsIds.Contains(s.Id))
          .Select(s => new
          {
            Id = s.Id,
            GenderTypeCode = s.GenderTypeCode,
            AccessionNumber = s.AccessionNumber,
            Zims = s.Zims,
            SpeciesNameLat = s.Species!.NameLat,
            SpeciesNameCz = s.Species.NameCz
          })
          .ToArrayAsync();

    result["dep_z"] = deponatedFromBaseData
          .Select(df =>
          {
            var firstDepFrom = specimenDataCache[df.Id].Movements
                  .OrderBy(m => m.Date)
                  .FirstOrDefault(m => m.IncrementReasonCode == QuantityCalculations.IN_DEPONATED_FROM_CODE);

            return new DeponationDto
            {
              AccessionNumber = df.AccessionNumber,
              Arks = df.Zims,
              Date = firstDepFrom?.Date,
              Gender = df.GenderTypeCode,
              Location = firstDepFrom?.Partner?.Keyword,
              Note = firstDepFrom?.Note,
              Price = specimenDataCache[df.Id].Movements.FirstOrDefault(m => m.Price != null)?.Price,
              Quantity = specimenDataCache[df.Id].Quantities.QuantityDeponatedFrom,
              SpeciesNameCz = df.SpeciesNameCz,
              SpeciesNameLat = df.SpeciesNameLat,
              SpecimenId = df.Id,
              Type = "dep_z"
            };
          })
          .ToArray();

    result["dep_do"] = deponatedToBaseData
      .Select(df =>
      {
        var lastDepTo = specimenDataCache[df.Id].Movements
              .OrderByDescending(m => m.Date)
              .FirstOrDefault(m => m.DecrementReasonCode == QuantityCalculations.OUT_DEPONATED_TO_CODE);

        return new DeponationDto
        {
          AccessionNumber = df.AccessionNumber,
          Arks = df.Zims,
          Date = lastDepTo?.Date,
          Gender = df.GenderTypeCode,
          Location = lastDepTo?.Partner?.Keyword,
          Note = lastDepTo?.Note,
          Price = specimenDataCache[df.Id].Movements.FirstOrDefault(m => m.Price != null)?.Price,
          Quantity = specimenDataCache[df.Id].Quantities.QuantityDeponatedTo,
          SpeciesNameCz = df.SpeciesNameCz,
          SpeciesNameLat = df.SpeciesNameLat,
          SpecimenId = df.Id,
          Type = "dep_do"
        };
      })
      .ToArray();

    result["dep_nar"] = deponatedBirthsBaseData
      .Select(df =>
      {
        var depBorn = specimenDataCache[df.Id].Movements.FirstOrDefault(m => m.IncrementReasonCode == QuantityCalculations.IN_DEPONATE_BORN && m.Partner != null);
        var allDeponateBorn = specimenDataCache[df.Id].Movements.Where(m => m.IncrementReasonCode == QuantityCalculations.IN_DEPONATE_BORN);

        return new DeponationDto
        {
          AccessionNumber = df.AccessionNumber,
          Arks = df.Zims,
          Date = depBorn?.Date,
          Gender = df.GenderTypeCode,
          Location = depBorn?.Partner?.Keyword,
          Note = depBorn?.Note,
          Price = specimenDataCache[df.Id].Movements.FirstOrDefault(m => m.Price != null)?.Price,
          Quantity = allDeponateBorn.Sum(adb => adb.QuantityActual),
          SpeciesNameCz = df.SpeciesNameCz,
          SpeciesNameLat = df.SpeciesNameLat,
          SpecimenId = df.Id,
          Type = "dep_nar"
        };
      }).ToArray();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<Dictionary<string, DeponationDto[]>>.FromItemAndFluentValidation(
            result,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
