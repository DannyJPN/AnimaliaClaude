using System.Globalization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.PrintExports.Endpoints;

// TODO VALIDATION
public class SpeciesInventory
{
  public record Request(string StatusDate, bool Vertebrata);

  public class TaxonomyClassDto
  {
    public string NameCz { get; set; } = null!;
    public string NameLat { get; set; } = null!;
    public string NameEn { get; set; } = null!;
    public List<SpeciesDto> Species { get; set; } = new List<SpeciesDto>();
  }

  public class SpeciesDto
  {
    public string NameLat { get; set; } = null!;
    public string NameCz { get; set; } = null!;
    public string NameEn { get; set; } = null!;
    public string? CITES { get; set; }
    public string? RDB { get; set; }
    public string? EU { get; set; }
    public string? CRochrana { get; set; }
    public bool EEP { get; set; }
    public bool ISB { get; set; }
    public bool ESB { get; set; }

    // Living counts 
    public int LivingM { get; set; }
    public int LivingF { get; set; }
    public int LivingU { get; set; }

    // Deposition counts
    public int DeponM { get; set; }
    public int DeponF { get; set; }
    public int DeponU { get; set; }

    public decimal SumPrice { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<TaxonomyClassDto[]>>, BadRequest<string>>> Handle(
      Request request,
      PziDbContext dbContext)
  {
    if (string.IsNullOrEmpty(request.StatusDate))
    {
      return TypedResults.BadRequest("Status date must be provided");
    }

    var specimensDataOnDate = await StateOnDateCalculation.CalculateSpecimensStateOnDate(
            dbContext,
            request.StatusDate,
            (query) => query.Where(m => m.Specimen!.TaxonomyHierarchyView!.IsVertebrate == request.Vertebrata),
            (quantity, _) => quantity.QuantityInZoo > 0 || quantity.QuantityDeponatedTo > 0);

    var specimenDataWithSpeciesId = await dbContext.Specimens
          .Where(s => specimensDataOnDate.acceptedSpecimenIds.Contains(s.Id))
          .Select(s => new
          {
            s.Id,
            s.SpeciesId,
            s.GenderTypeCode,
            s.AccessionNumber,
            s.InDate,
            s.BirthDate,
          })
          .ToArrayAsync();

    var specimenDataBySpeciesId = specimenDataWithSpeciesId
          .GroupBy(s => s.SpeciesId)
          .ToDictionary(
            g => g.Key,
            g => g.ToArray()
          );

    var speciesData = await dbContext.Species
            .Where(sp => sp.Specimens!.Any(s => specimensDataOnDate.acceptedSpecimenIds.Contains(s.Id)))
            .Select(sp => new
            {
              Id = sp.Id,
              NameCz = sp.NameCz,
              NameLat = sp.NameLat,
              NameEn = sp.NameEn,
              CITES = sp.CiteTypeCode,
              RDB = sp.RdbCode,
              EU = sp.EuCode,
              CRochrana = sp.ProtectionTypeCode,
              EEP = sp.IsEep,
              ISB = sp.IsIsb,
              ESB = sp.IsEsb,
              ClassId = sp.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.Id,
              ClassNameCz = sp.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass.NameCz,
              ClassNameLat = sp.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass.NameLat,
              ClassNameEn = sp.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass.NameEn,
              ClassCode = sp.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass.Code,
            })
            .ToArrayAsync();

    var mappedResults = speciesData
          .GroupBy(sp => sp.ClassId)
          .OrderBy(g => g.First().ClassCode)
          .Select(g =>
          {
            var first = g.First();

            var speciesMappedData = g.Select(sp =>
            {
              var specimens = specimenDataBySpeciesId[sp.Id];

              var maleData = specimens
                    .Where(s => s.GenderTypeCode?.StartsWith("M") == true)
                    .Select(s =>
                    {
                      var inZoo = specimensDataOnDate.acceptedSpecimensCache[s.Id].Quantities.QuantityInZoo;
                      var deponatedTo = specimensDataOnDate.acceptedSpecimensCache[s.Id].Quantities.QuantityDeponatedTo;
                      var price = specimensDataOnDate.acceptedSpecimensCache[s.Id].Movements.LastOrDefault(m => m.Price != null)?.Price;

                      return (inZoo, deponatedTo, price);
                    })
                    .ToArray();

              var femaleData = specimens
                    .Where(s => s.GenderTypeCode?.StartsWith("F") == true)
                    .Select(s =>
                    {
                      var inZoo = specimensDataOnDate.acceptedSpecimensCache[s.Id].Quantities.QuantityInZoo;
                      var deponatedTo = specimensDataOnDate.acceptedSpecimensCache[s.Id].Quantities.QuantityDeponatedTo;
                      var price = specimensDataOnDate.acceptedSpecimensCache[s.Id].Movements.LastOrDefault(m => m.Price != null)?.Price;

                      return (inZoo, deponatedTo, price);
                    })
                    .ToArray();

              var unknownData = specimens
                    .Where(s => s.GenderTypeCode?.StartsWith("U") == true)
                    .Select(s =>
                    {
                      var inZoo = specimensDataOnDate.acceptedSpecimensCache[s.Id].Quantities.QuantityInZoo;
                      var deponatedTo = specimensDataOnDate.acceptedSpecimensCache[s.Id].Quantities.QuantityDeponatedTo;
                      var price = specimensDataOnDate.acceptedSpecimensCache[s.Id].Movements.LastOrDefault(m => m.Price != null)?.Price;

                      return (inZoo, deponatedTo, price);
                    })
                    .ToArray();

              var livingM = maleData.Sum(d => d.inZoo);
              var deponM = maleData.Sum(d => d.deponatedTo);

              var livingF = femaleData.Sum(d => d.inZoo);
              var deponF = femaleData.Sum(d => d.deponatedTo);

              var livingU = unknownData.Sum(d => d.inZoo);
              var deponU = unknownData.Sum(d => d.deponatedTo);

              var sumMalePrice = maleData.Sum(d =>
              {
                var price = d.price ?? 0;

                return d.inZoo * price + d.deponatedTo * price;
              });

              var sumFemalePrice = femaleData.Sum(d =>
              {
                var price = d.price ?? 0;

                return d.inZoo * price + d.deponatedTo * price;
              });

              var sumUnknownPrice = unknownData.Sum(d =>
              {
                var price = d.price ?? 0;

                return d.inZoo * price + d.deponatedTo * price;
              });

              return new SpeciesDto
              {
                CITES = sp.CITES,
                CRochrana = sp.CRochrana,
                EEP = sp.EEP,
                ESB = sp.ESB,
                EU = sp.EU,
                ISB = sp.ISB,
                NameCz = sp.NameCz ?? "",
                NameEn = sp.NameEn ?? "",
                NameLat = sp.NameLat ?? "",
                RDB = sp.RDB,

                LivingF = livingF,
                LivingM = livingM,
                LivingU = livingU,

                DeponF = deponF,
                DeponM = deponM,
                DeponU = deponU,

                SumPrice = sumMalePrice + sumFemalePrice + sumUnknownPrice
              };
            })
            .OrderBy(e => e.NameCz, StringComparer.Create(CultureInfo.CreateSpecificCulture("cs-CZ"), CompareOptions.StringSort))
            .ToList();

            return new TaxonomyClassDto
            {
              NameCz = first.ClassNameCz ?? "",
              NameEn = first.ClassNameEn ?? "",
              NameLat = first.ClassNameLat ?? "",
              Species = speciesMappedData
            };
          })
          .ToArray();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<TaxonomyClassDto[]>.FromItemAndFluentValidation(
            mappedResults,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
