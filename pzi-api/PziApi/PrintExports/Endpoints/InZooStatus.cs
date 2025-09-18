/* ZA-46 -> Sestavy / Zoologie - V majetku (P3) */

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class InZooStatus
{
  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public SpecimenDto[] Specimens { get; set; } = null!;
  }

  public class SpecimenDto
  {
    public int Id { get; set; }
    public int SpeciesId { get; set; }
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
    public int? FatherAccessionNumber { get; set; }
    public int? MotherAccessionNumber { get; set; }
    public string? InDate { get; set; }
    public string? InReasonCode { get; set; }
    public string? InReasonDisplayName { get; set; }
    public string? InLocationName { get; set; }
    public string? OutDate { get; set; }
    public string? OutReasonCode { get; set; }
    public string? OutReasonDisplayName { get; set; }
    public string? RegionName { get; set; }
    public string? Ubication { get; set; }
    public string? OutLocationName { get; set; }
    public string? Rearing { get; set; }
  }

  public class Request
  {
    public int ClassId { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesDto[]>>, BadRequest>> Handle(Request request, PziDbContext dbContext)
  {
    var speciesResult = await dbContext.Species
      .Where(s => s.ZooStatus == "Z" || s.ZooStatus == "D")
      .Where(s => s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClassId == request.ClassId)
      .OrderByDescending(s => s.NameCz)
      .ThenBy(s => s.Id)
      .Select(s => new SpeciesDto
      {
        Id = s.Id,
        NameCz = s.NameCz,
        NameLat = s.NameLat
      })
      .ToArrayAsync();

    var speciesIds = speciesResult.Select(sp => sp.Id).ToHashSet();

    var specimensDictionary = await dbContext.Specimens
      .Include(sp => sp.OrganizationLevel)
        .ThenInclude(org => org!.Parent)
      .Where(sp => speciesIds.Contains(sp.SpeciesId) && (sp.OutReasonCode == null || sp.OutReasonCode == "OUT05" || sp.OutReasonCode == "OUT07"))
      
      .Select(sp => new SpecimenDto
      {
        Id = sp.Id,
        SpeciesId = sp.SpeciesId,
        AccessionNumber = sp.AccessionNumber,
        GenderTypeCode = sp.GenderTypeCode,
        Zims = sp.Zims,
        StudBookNumber = sp.StudBookNumber,
        StudBookName = sp.StudBookName,
        Name = sp.Name,
        RegisteredDate = sp.RegisteredDate,
        BirthDate = sp.BirthDate,
        Notch = string.IsNullOrEmpty(sp.Notch) ? "" : sp.Notch.Trim(),
        Chip = string.IsNullOrEmpty(sp.Chip) ? "" : sp.Chip.Trim(),
        RingNumber = sp.RingNumber,
        FatherAccessionNumber = sp.Father!.AccessionNumber,
        MotherAccessionNumber = sp.Mother!.AccessionNumber,
        InDate = sp!.InDate,
        InReasonCode = sp.InReasonCode,
        InReasonDisplayName = sp!.InReason!.DisplayName,
        InLocationName = sp.InLocation == null ? null : sp.InLocation.Keyword,
        OutDate = sp.OutDate,
        OutReasonCode = sp.OutReasonCode,
        OutReasonDisplayName = sp!.OutReason!.DisplayName,
        OutLocationName = sp.OutLocation == null ? null : sp.OutLocation.Keyword,
        RegionName = sp.OrgHierarchyView!.DistrictName,
        Ubication = sp.OrgHierarchyView!.DepartmentName,
        Rearing = sp.Rearing
      })
      .GroupBy(m => m.SpeciesId)
      .ToDictionaryAsync(s => s.Key, s => s.OrderBy(sp => sp.AccessionNumber).ToArray());

    foreach (var s in speciesResult)
    {
      s.Specimens = specimensDictionary.TryGetValue(s.Id, out var specimens) ? specimens : Array.Empty<SpecimenDto>();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<SpeciesDto[]>.FromItemAndFluentValidation(
        speciesResult,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
