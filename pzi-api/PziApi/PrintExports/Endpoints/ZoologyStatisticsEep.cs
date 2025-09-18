using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class ZoologyStatisticsEep
{
  public record Request(string AsOfDate);

  public class ClassStatistics
  {
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }

    public int TotalSpeciesCount { get; set; }
    public int TotalMaleCount { get; set; }
    public int TotalFemaleCount { get; set; }
    public int TotalUnknownCount { get; set; }
    public int CitesSpeciesCount { get; set; }
    public int CitesSpecimensCount { get; set; }
    public int CitesMzpSpeciesCount { get; set; }
    public int CitesMzpSpecimensCount { get; set; }
    public int EuSpeciesCount { get; set; }
    public int EuSpecimensCount { get; set; }
    public int EuMzpSpeciesCount { get; set; }
    public int EuMzpSpecimensCount { get; set; }
    public int RdbSpeciesCount { get; set; }
    public int RdbSpecimensCount { get; set; }
    public int CrSpeciesCount { get; set; }
    public int CrSpecimensCount { get; set; }
    public int EepSpeciesCount { get; set; }
    public int EepSpecimensCount { get; set; }
    public int IsbSpeciesCount { get; set; }
    public int IsbSpecimensCount { get; set; }
    public int EsbSpeciesCount { get; set; }
    public int EsbSpecimensCount { get; set; }
  }

  public class SpecimenStatistics
  {
    public int Id { get; set; }
    public string? SpeciesNameLat { get; set; }
    public string? SpeciesNameCz { get; set; }
    public int SpeciesId { get; set; }
    public int? AccessionNumber { get; set; }
    public string? InDate { get; set; }
    public string? BirthDate { get; set; }
  }

  public class ResponseDto
  {
    public IEnumerable<ClassStatistics> ClassStatistics { get; set; } = [];
    public IEnumerable<SpecimenStatistics> SpecimenStatistics { get; set; } = [];
  }

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.AsOfDate)
          .NotEmpty()
          .Must(DateTimeHelpers.IsValidFullDateString)
          .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
          .WithMessage("AsOfDate is not valid date (yyyy/MM/dd).");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<ResponseDto>>, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    var validator = new RequestValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var specimensDataOnDate = await StateOnDateCalculation.CalculateSpecimensStateOnDate(dbContext, request.AsOfDate,
      (query) => query.Where(m => m.Specimen!.TaxonomyHierarchyView!.IsVertebrate == true || m.Specimen!.TaxonomyHierarchyView!.IsVertebrate == false),
      (quantity, _) => quantity.QuantityInZoo > 0);

    var specimensInZooCache = specimensDataOnDate.acceptedSpecimensCache;
    var specimenIdsCache = specimensDataOnDate.acceptedSpecimenIds;

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

    var specimenData = specimenDataWithSpeciesId;

    var distinctSpeciesIds = specimenData
          .Select(s => s.SpeciesId)
          .Distinct().ToArray();

    var speciesData = await dbContext.Species
          .Where(sp => distinctSpeciesIds.Contains(sp.Id))
          .Select(sp => new
          {
            sp.Id,
            sp.NameLat,
            sp.NameCz,
            sp.CiteTypeCode,
            sp.RdbCode,
            sp.IsEep,
            sp.IsIsb,
            sp.IsEsb,
            sp.EuCode,
            sp.ProtectionTypeCode,
            ClassId = sp.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClassId
          })
          .ToArrayAsync();

    var distinctClassIds = speciesData
          .Select(s => s.ClassId)
          .Distinct()
          .ToArray();

    var classesData = await dbContext.TaxonomyClasses
          .Where(tc => distinctClassIds.Contains(tc.Id))
          .OrderBy(tc => tc.Code)
          .Select(tc => new
          {
            tc.Id,
            tc.Code,
            tc.NameCz,
            tc.NameLat,
            tc.TaxonomyPhylum!.IsVertebrate
          })
          .ToArrayAsync();

    var speciesByClassId = speciesData
          .GroupBy(sd => sd.ClassId)
          .ToDictionary(g => g.Key, g => g.ToArray());

    var specimensBySpeciesId = specimenData
          .GroupBy(s => s.SpeciesId)
          .ToDictionary(g => g.Key, g => g.ToArray());

    var classStats = classesData
          .Select(cd =>
    {
      var clsSpecies = speciesByClassId[cd.Id];

      var totalSpeciesCount = clsSpecies.Length;

      var totalMaleCount = clsSpecies.Sum(sp => specimensBySpeciesId[sp.Id]
          .Where(s => s.GenderTypeCode![0] == 'M')
          .Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo));

      var totalFemaleCount = clsSpecies.Sum(sp => specimensBySpeciesId[sp.Id]
          .Where(s => s.GenderTypeCode![0] == 'F')
          .Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo));

      var totalUnknownCount = clsSpecies.Sum(sp => specimensBySpeciesId[sp.Id]
          .Where(s => s.GenderTypeCode![0] == 'U')
          .Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo));

      var citesSpecies = clsSpecies
              .Where(sp => !string.IsNullOrEmpty(sp.CiteTypeCode))
              .ToArray();

      var euSpecies = clsSpecies
              .Where(sp => !string.IsNullOrEmpty(sp.EuCode))
              .ToArray();

      var citesMzpSpecies = clsSpecies
        .Where(sp => sp.CiteTypeCode == "I" || sp.CiteTypeCode == "II")
        .ToArray();

      var euMzpSpecies = clsSpecies
              .Where(sp => sp.EuCode == "A" || sp.EuCode == "B")
              .ToArray();

      var rdbSpecies = clsSpecies
            .Where(sp => !string.IsNullOrEmpty(sp.RdbCode))
            .ToArray();

      var crSpecies = clsSpecies
            .Where(sp => !string.IsNullOrEmpty(sp.ProtectionTypeCode))
            .ToArray();

      var eepSpecies = clsSpecies
            .Where(sp => sp.IsEep)
            .ToArray();

      var isbSpecies = clsSpecies
            .Where(sp => sp.IsIsb)
            .ToArray();

      var esbSpecies = clsSpecies
            .Where(sp => sp.IsEsb)
            .ToArray();

      var citesSpeciesCount = citesSpecies.Count();
      var citesSpecimensCount = citesSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      var euSpeciesCount = euSpecies.Count();
      var euSpecimensCount = euSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      var citesMzpSpeciesCount = citesMzpSpecies.Count();
      var citesMzpSpecimensCount = citesMzpSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      var euMzpSpeciesCount = euMzpSpecies.Count();
      var euMzpSpecimensCount = euMzpSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      var rdbSpeciesCount = rdbSpecies.Count();
      var rdbSpecimensCount = rdbSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      var crSpeciesCount = crSpecies.Count();
      var crSpecimensCount = crSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      var eepSpeciesCount = eepSpecies.Count();
      var eepSpecimensCount = eepSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      var isbSpeciesCount = isbSpecies.Count();
      var isbSpecimensCount = isbSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      var esbSpeciesCount = esbSpecies.Count();
      var esbSpecimensCount = esbSpecies.Sum(sp =>
            specimensBySpeciesId[sp.Id].Sum(s => specimensInZooCache[s.Id].Quantities.QuantityInZoo)
      );

      return new
      {
        cd.Id,
        cd.Code,
        cd.IsVertebrate,
        cd.NameCz,
        cd.NameLat,

        TotalSpeciesCount = speciesByClassId[cd.Id].Length,

        TotalMaleCount = totalMaleCount,
        TotalFemaleCount = totalFemaleCount,
        TotalUnknownCount = totalUnknownCount,

        CitesSpeciesCount = citesSpeciesCount,
        CitesSpecimensCount = citesSpecimensCount,
        EuSpeciesCount = euSpeciesCount,
        EuSpecimensCount = euSpecimensCount,
        CitesMzpSpeciesCount = citesMzpSpeciesCount,
        CitesMzpSpecimensCount = citesMzpSpecimensCount,
        EuMzpSpeciesCount = euMzpSpeciesCount,
        EuMzpSpecimensCount = euMzpSpecimensCount,
        RdbSpeciesCount = rdbSpeciesCount,
        RdbSpecimensCount = rdbSpecimensCount,
        CrSpeciesCount = crSpeciesCount,
        CrSpecimensCount = crSpecimensCount,
        EepSpeciesCount = eepSpeciesCount,
        EepSpecimensCount = eepSpecimensCount,
        IsbSpeciesCount = isbSpeciesCount,
        IsbSpecimensCount = isbSpecimensCount,
        EsbSpeciesCount = esbSpeciesCount,
        EsbSpecimensCount = esbSpecimensCount
      };
    })
    .ToArray();

    var vertebrateClassesStats = classStats
                .Where(cs => cs.IsVertebrate)
                .Select(cs => new ClassStatistics()
                {
                  NameCz = cs.NameCz,
                  NameLat = cs.NameLat,
                  TotalSpeciesCount = cs.TotalSpeciesCount,
                  TotalFemaleCount = cs.TotalFemaleCount,
                  TotalMaleCount = cs.TotalMaleCount,
                  TotalUnknownCount = cs.TotalUnknownCount,
                  CitesSpeciesCount = cs.CitesSpeciesCount,
                  CitesSpecimensCount = cs.CitesSpecimensCount,
                  CitesMzpSpeciesCount = cs.CitesMzpSpeciesCount,
                  CitesMzpSpecimensCount = cs.CitesMzpSpecimensCount,
                  EuSpeciesCount = cs.EuSpeciesCount,
                  EuSpecimensCount = cs.EuSpecimensCount,
                  EuMzpSpeciesCount = cs.EuMzpSpeciesCount,
                  EuMzpSpecimensCount = cs.EuMzpSpecimensCount,
                  RdbSpeciesCount = cs.RdbSpeciesCount,
                  RdbSpecimensCount = cs.RdbSpecimensCount,
                  CrSpeciesCount = cs.CrSpeciesCount,
                  CrSpecimensCount = cs.CrSpecimensCount,
                  EepSpeciesCount = cs.EepSpeciesCount,
                  EepSpecimensCount = cs.EepSpecimensCount,
                  IsbSpeciesCount = cs.IsbSpeciesCount,
                  IsbSpecimensCount = cs.IsbSpecimensCount,
                  EsbSpeciesCount = cs.EsbSpeciesCount,
                  EsbSpecimensCount = cs.EsbSpecimensCount
                })
                .ToList();

    var invertebrateClassesStats = classStats
            .Where(cs => !cs.IsVertebrate)
            .ToArray();

    var invClassStats = new ClassStatistics()
    {
      NameCz = "bezobratlí",
      NameLat = "Invertebrata",
      TotalSpeciesCount = invertebrateClassesStats.Sum(cs => cs.TotalSpeciesCount),
      TotalFemaleCount = invertebrateClassesStats.Sum(cs => cs.TotalFemaleCount),
      TotalMaleCount = invertebrateClassesStats.Sum(cs => cs.TotalMaleCount),
      TotalUnknownCount = invertebrateClassesStats.Sum(cs => cs.TotalUnknownCount),
      CitesSpeciesCount = invertebrateClassesStats.Sum(cs => cs.CitesSpeciesCount),
      CitesSpecimensCount = invertebrateClassesStats.Sum(cs => cs.CitesSpecimensCount),
      CitesMzpSpeciesCount = invertebrateClassesStats.Sum(cs => cs.CitesMzpSpeciesCount),
      CitesMzpSpecimensCount = invertebrateClassesStats.Sum(cs => cs.CitesMzpSpecimensCount),
      EuSpeciesCount = invertebrateClassesStats.Sum(cs => cs.EuSpeciesCount),
      EuSpecimensCount = invertebrateClassesStats.Sum(cs => cs.EuSpecimensCount),
      EuMzpSpeciesCount = invertebrateClassesStats.Sum(cs => cs.EuMzpSpeciesCount),
      EuMzpSpecimensCount = invertebrateClassesStats.Sum(cs => cs.EuMzpSpecimensCount),
      RdbSpeciesCount = invertebrateClassesStats.Sum(cs => cs.RdbSpeciesCount),
      RdbSpecimensCount = invertebrateClassesStats.Sum(cs => cs.RdbSpecimensCount),
      CrSpeciesCount = invertebrateClassesStats.Sum(cs => cs.CrSpeciesCount),
      CrSpecimensCount = invertebrateClassesStats.Sum(cs => cs.CrSpecimensCount),
      EepSpeciesCount = invertebrateClassesStats.Sum(cs => cs.EepSpeciesCount),
      EepSpecimensCount = invertebrateClassesStats.Sum(cs => cs.EepSpecimensCount),
      IsbSpeciesCount = invertebrateClassesStats.Sum(cs => cs.IsbSpeciesCount),
      IsbSpecimensCount = invertebrateClassesStats.Sum(cs => cs.IsbSpecimensCount),
      EsbSpeciesCount = invertebrateClassesStats.Sum(cs => cs.EsbSpeciesCount),
      EsbSpecimensCount = invertebrateClassesStats.Sum(cs => cs.EsbSpecimensCount)
    };

    var allClassStats = new List<ClassStatistics>();

    allClassStats.AddRange(vertebrateClassesStats);
    allClassStats.Add(invClassStats);

    var earliestAquiredSpecimens = specimenData
            .OrderBy(sd => sd.InDate)
            .Where(sd => string.Compare(sd.InDate, "1900") >= 0)
            .Take(10)
            .ToArray();

    var specimenStats = earliestAquiredSpecimens
            .Select(sd =>
            {
              var species = speciesData.First(sp => sp.Id == sd.SpeciesId);

              return new SpecimenStatistics()
              {
                Id = sd.Id,
                SpeciesId = sd.SpeciesId,
                AccessionNumber = sd.AccessionNumber,
                BirthDate = sd.BirthDate,
                InDate = sd.InDate,
                SpeciesNameCz = species.NameCz,
                SpeciesNameLat = species.NameLat
              };
            })
            .ToArray();

    var result = new ResponseDto()
    {
      ClassStatistics = allClassStats,
      SpecimenStatistics = specimenStats
    };

    return TypedResults.Ok(
        CommonDtos.SuccessResult<ResponseDto>.FromItem(result)
    );
  }
}
