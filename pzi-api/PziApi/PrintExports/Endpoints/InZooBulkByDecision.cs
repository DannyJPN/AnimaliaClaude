// ZA-54 - Sestavy / Zoologie - V majetku (hromadne) - podle rozhodnuti (P1)

using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.Globalization;

namespace PziApi.PrintExports.Endpoints;

public class InZooBulkByDecision
{
  public record Request(string Mode);

  public class SpeciesGroupDto
  {
    public required string Decision { get; set; }
    public required SpeciesDto[] Species { get; set; }
  }

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? Decision { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? Cites { get; set; }
    public string? Classis { get; set; }
    public SpecimenDto[] Specimens { get; set; } = null!;
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
    public string? BirthDate { get; set; }
    public string? InDate { get; set; }
    public string? InReasonCode { get; set; }
    public string? InReasonDisplayName { get; set; }
    public string? InLocationName { get; set; }
    public decimal? Price { get; set; }
    public string? RegionName { get; set; }
    public string? Ubication { get; set; }
    public int SpeciesId { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesGroupDto[]>>, NotFound>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    var speciesQuery = dbContext.Species.Where(s => s.ZooStatus == "Z");

    if (request.Mode == "decisioneu")
      speciesQuery = speciesQuery.Where(s => !string.IsNullOrWhiteSpace(s.EuFaunaRefNumber));
    else if (request.Mode == "decisioncr")
      speciesQuery = speciesQuery.Where(s => !string.IsNullOrWhiteSpace(s.CrExceptionRefNumber));
    else
      return TypedResults.NotFound();

    var speciesArray = await speciesQuery
        .Where(s => s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum!.IsVertebrate)
        .Select(s => new SpeciesDto
        {
          Id = s.Id,
          Decision = request.Mode == "decisioneu" ? s.EuFaunaRefNumber : s.CrExceptionRefNumber,
          NameCz = s.NameCz,
          NameLat = s.NameLat,
          Cites = s.CiteTypeCode,
          Classis = s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.NameLat
        })
        .ToArrayAsync();

    if (speciesArray.Length == 0)
      return TypedResults.NotFound();

    var speciesIds = speciesArray.Where(sp => !string.IsNullOrEmpty(sp.Decision)).Select(sp => sp.Id).ToHashSet();

    var specimensDictionary = await dbContext.Specimens
        .Where(sp =>
            speciesIds.Contains(sp.SpeciesId) &&
            sp.QuantityInZoo > 0 &&
            string.IsNullOrEmpty(sp.OutDate))
        .Select(sp => new SpecimenDto
        {
          Id = sp.Id,
          AccessionNumber = sp.AccessionNumber,
          GenderTypeCode = sp.GenderTypeCode,
          Zims = sp.Zims,
          StudBookNumber = sp.StudBookNumber,
          StudBookName = sp.StudBookName,
          Name = sp.Name,
          Notch = string.IsNullOrEmpty(sp.Notch) ? "" : sp.Notch.Trim(),
          Chip = string.IsNullOrEmpty(sp.Chip) ? "" : sp.Chip.Trim(),
          RingNumber = sp.RingNumber,
          RegisteredDate = sp.RegisteredDate,
          BirthDate = sp.BirthDate,
          InDate = (sp.InReasonCode == "IN01" || sp.InReasonCode == "IN07") ? "" :  sp.InDate, // in the run script, this is empty if 'narozeni / narozeni deponatu'
          InReasonCode = sp.InReasonCode,
          InReasonDisplayName = (sp.InReasonCode == "IN01" || sp.InReasonCode == "IN07") ? "" : sp.InReason!.DisplayName,
          InLocationName = sp.InLocation!.Keyword,
          Price = sp.Price,
          RegionName = sp.OrgHierarchyView!.DistrictName,
          SpeciesId = sp.SpeciesId,
          Ubication = dbContext.SpecimenPlacements
            .Where(p => p.SpecimenId == sp.Id)
            .OrderByDescending(p => p.ValidSince)
            .Select(p => p.Note)
            .FirstOrDefault()
        })
        .GroupBy(m => m.SpeciesId)
        .ToDictionaryAsync(s => s.Key, s => s.OrderBy(sp => sp.AccessionNumber).ToArray());

    foreach (var s in speciesArray)
    {
      s.Specimens = specimensDictionary.TryGetValue(s.Id, out var specimens) ? specimens : Array.Empty<SpecimenDto>();
    }

    var groups = speciesArray
      .GroupBy(s => s.Decision!);

    var speciesGroups = new List<SpeciesGroupDto>();
    foreach (var g in groups)
    {
      speciesGroups.Add(new SpeciesGroupDto()
      {
        Decision = g.Key,
        Species = g.OrderBy(s => s.NameCz, StringComparer.Create(CultureInfo.GetCultureInfo("cs-CZ"), true)).ThenBy(s => s.Id).ToArray()
      });
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpeciesGroupDto[]>
            .FromItemAndFluentValidation(
              speciesGroups.OrderByDescending(s => s.Decision).ToArray(),
              new ValidationResult()
            )
    );
  }
}
