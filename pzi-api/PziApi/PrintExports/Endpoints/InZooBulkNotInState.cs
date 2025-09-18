using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.Globalization;

namespace PziApi.PrintExports.Endpoints;

public class InZooBulkNotInState
{
  public record Request(int ClassId);

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? Cites { get; set; }
    public bool? IsRegulationRequirement { get; set; }
    public SpecimenDto[] Specimens { get; set; } = null!;
    public decimal? Price { get; set; }
  }

  public class SpecimenDto
  {
    public int Id { get; set; }
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? Zims { get; set; }
    public string? StudBookNumber { get; set; }
    public string? StudBookName { get; set; }
    public string? Name { get; set; }
    public string? Notch { get; set; }
    public string? Chip { get; set; }
    public string? RingNumber { get; set; }
    public string? RegisteredDate { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? BirthDate { get; set; }
    public int? FatherAccessionNumber { get; set; }
    public int? MotherAccessionNumber { get; set; }
    public string? InDate { get; set; }
    public string? InReasonCode { get; set; }
    public string? InReasonDisplayName { get; set; }
    public string? InLocationName { get; set; }
    public decimal? Price { get; set; }
    public int? SpeciesId { get; set; }
    public string? RegionName { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesDto[]>>, NotFound>> Handle(
    [FromBody] Request request,
    PziDbContext dbContext
)
  {
    var speciesResult = await dbContext.Species
      .Where(s => s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClassId == request.ClassId)
      .Where(s => s.ZooStatus == "Z")
      .Select(s => new SpeciesDto
      {
        Id = s.Id,
        NameCz = s.NameCz,
        NameLat = s.NameLat,
        Cites = s.CiteTypeCode,
        IsRegulationRequirement = s.IsRegulationRequirement,
      })
      .ToArrayAsync();

    if (speciesResult == null || speciesResult.Length == 0)
    {
      return TypedResults.Ok(
        CommonDtos.SuccessResult<SpeciesDto[]>.FromItemAndFluentValidation(
          new SpeciesDto[] { new SpeciesDto { Specimens = Array.Empty<SpecimenDto>() } },
          new FluentValidation.Results.ValidationResult()
        )
      );
    }

    var speciesIds = speciesResult.Select(s => s.Id).ToHashSet();

    var specisSpecimensDictionary = await dbContext.Specimens
        .Where(sp => sp.TaxonomyHierarchyView!.ClassId == request.ClassId)
        .Where(sp => speciesIds.Contains(sp.SpeciesId)
              && sp.QuantityInZoo > 0
              && sp.InReasonCode == "IN01"
              && string.IsNullOrEmpty(sp.OutDate))
        .Select(sp => new SpecimenDto
        {
          Id = sp.Id,
          AccessionNumber = sp.AccessionNumber,
          GenderTypeCode = sp.GenderTypeCode,
          Zims = sp.Zims,
          StudBookNumber = sp.StudBookNumber,
          StudBookName = sp.StudBookName,
          Name = sp.Name,
          RegisteredDate = sp.RegisteredDate,
          RegistrationNumber = sp.RegistrationNumber,
          BirthDate = sp.BirthDate,
          Notch = sp.Notch == null ? string.Empty : sp.Notch.Trim(),
          Chip = sp.Chip == null ? string.Empty : sp.Chip.Trim(),
          RingNumber = sp.RingNumber,
          InDate = sp.InReasonCode == "IN01" ? "" : sp.InDate, // in the run script, this is empty if 'narozeni'
          InReasonCode = sp.InReasonCode,
          InReasonDisplayName = sp.InReasonCode == "IN01" ? "" : sp.InReason!.DisplayName,
          InLocationName = sp.InLocation!.Keyword,
          Price = sp.Price,
          SpeciesId = sp.SpeciesId,
          RegionName = sp.OrgHierarchyView != null ? sp.OrgHierarchyView.DistrictName : null
        })
        .GroupBy(sp => sp.SpeciesId!.Value)
        .ToDictionaryAsync(s => s.Key, s => s.ToList());

    var speciesFinalResult = new List<SpeciesDto>();
    foreach (var species in speciesResult)
    {
      if (specisSpecimensDictionary.TryGetValue(species.Id, out var specimensResult))
      {
        species.Price = specimensResult.Sum(x => x.Price);
        species.Specimens = specimensResult.Where(x => !x.Price.HasValue || x.Price.Value == 0M).OrderBy(sp => sp.AccessionNumber).ToArray();

        if (species.Specimens.Length > 0)
        {
          speciesFinalResult.Add(species);
        }
      }
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<SpeciesDto[]>.FromItemAndFluentValidation(
        speciesFinalResult
          .OrderBy(s => s.NameCz, StringComparer.Create(CultureInfo.GetCultureInfo("cs-CZ"), true))
          .ThenBy(s => s.Id)
          .ToArray(),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}