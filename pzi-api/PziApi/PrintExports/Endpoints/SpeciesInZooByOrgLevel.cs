using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpeciesInZooByOrgLevel
{
  public record Request(bool IsVertebrata, int OrganizationLevelId);

  public class OrganizationLevelDto
  {
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? SectionName { get; set; }
    public ICollection<SpeciesDto> Species { get; set; } = null!;
  }

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public decimal? PriceTotal { get; set; } = 0;
    public string? Cites { get; set; }
    public ICollection<SpecimenDto> Specimens { get; set; } = null!;
  }

  public class SpecimenDto
  {
    public int Id { get; set; }
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? StudBookName { get; set; }
    public string? RegisteredDate { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? BirthDate { get; set; }
    public string? InDate { get; set; }
    public string? InReasonCode { get; set; }
    public string? InReasonDisplayName { get; set; }
    public string? InLocationName { get; set; }
    public decimal? Price { get; set; }
    public int SpeciesId { get; set; }
    public string? OutDate { get; set; }
    public string? RingNumber { get; set; }
    public string? Notch { get; set; }
    public string? Chip { get; set; }
    public string? Name { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<OrganizationLevelDto>>, NotFound>> Handle([FromBody] Request request, PziDbContext dbContext)
  {
    var organizationLevelId = request.OrganizationLevelId;

    var orgInfo = await dbContext.OrgHierarchyView
        .Where(o => o.Id == organizationLevelId)
        .Select(o => new
        {
          o.DistrictId,
          o.DistrictName,
          o.WorkplaceId,
          o.WorkplaceName,
          o.DepartmentId,
          o.DepartmentName
        })
        .FirstOrDefaultAsync();

    if (orgInfo == null)
    {
      return TypedResults.NotFound();
    }

    var phylaIds = await dbContext.TaxonomyPhyla
      .Where(p => p.IsVertebrate == request.IsVertebrata)
      .Select(p => p.Id)
      .ToArrayAsync();

    var specimenQuery = dbContext.Specimens
      .Where(s => phylaIds.Contains(s.TaxonomyHierarchyView!.PhylumId))
      .Where(sp => sp.QuantityInZoo > 0 && string.IsNullOrEmpty(sp.OutDate));

    string? orgName = null;
    string? sectionName = orgInfo.DepartmentName;

    if (orgInfo.DistrictId == organizationLevelId)
    {
      specimenQuery = specimenQuery.Where(sp => sp.OrgHierarchyView!.DistrictId == organizationLevelId);
      orgName = orgInfo.DistrictName;
    }
    else if (orgInfo.WorkplaceId == organizationLevelId)
    {
      specimenQuery = specimenQuery.Where(sp => sp.OrgHierarchyView!.WorkplaceId == organizationLevelId);
      orgName = orgInfo.WorkplaceName;
    }
    else if (orgInfo.DepartmentId == organizationLevelId)
    {
      specimenQuery = specimenQuery.Where(sp => sp.OrgHierarchyView!.DepartmentId == organizationLevelId);
      orgName = orgInfo.DepartmentName;
    }
    else
    {
      return TypedResults.NotFound();
    }

    var specimensDictionary = await specimenQuery
        .Select(sp => new SpecimenDto
        {
          Id = sp.Id,
          AccessionNumber = sp.AccessionNumber,
          GenderTypeCode = sp.GenderTypeCode,
          StudBookName = sp.StudBookName,
          RegisteredDate = sp.RegisteredDate,
          RegistrationNumber = sp.RegistrationNumber,
          BirthDate = sp.BirthDate,
          InDate = sp.InDate,
          InReasonCode = sp.InReasonCode,
          InReasonDisplayName = sp.InReason != null ? sp.InReason.DisplayName : null,
          InLocationName = sp.InLocation != null ? sp.InLocation.Keyword : null,
          Price = sp.Price,
          SpeciesId = sp.SpeciesId,
          OutDate = sp.OutDate,
          Notch = sp.Notch == null ? string.Empty : sp.Notch.Trim(),
          Chip = sp.Chip == null ? string.Empty : sp.Chip.Trim(),
          RingNumber = sp.RingNumber,
          Name = sp.Name
        })
        .GroupBy(sp => sp.SpeciesId)
        .ToDictionaryAsync(g => g.Key, g => g.OrderBy(sp => sp.AccessionNumber).ToArray());

    var speciesIds = specimensDictionary.Keys;

    var species = await dbContext.Species
        .Where(s => speciesIds.Contains(s.Id))
        .Select(s => new SpeciesDto
        {
          Id = s.Id,
          NameCz = s.NameCz,
          NameLat = s.NameLat,
          Cites = s.CiteTypeCode
        })
        .ToListAsync();

    foreach (var s in species)
    {
      s.Specimens = specimensDictionary.TryGetValue(s.Id, out var specimens)
        ? specimens
        : Array.Empty<SpecimenDto>();
      s.PriceTotal = s.Specimens.Sum(sp => sp.Price ?? 0);
    }

    var orgLevelResult = new OrganizationLevelDto
    {
      Id = organizationLevelId,
      Name = orgName,
      SectionName = sectionName,
      Species = species
    };

    return TypedResults.Ok(
      CommonDtos.SuccessResult<OrganizationLevelDto>.FromItemAndFluentValidation(
        orgLevelResult,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
