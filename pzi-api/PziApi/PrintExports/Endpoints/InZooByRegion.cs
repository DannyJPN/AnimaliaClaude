using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class InZooByRegion
{
  public record Request(string? Type = "vertebrata");

  public class OrgLevelDTO
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
    public string? CITES { get; set; }
    public decimal? PriceTotal { get; set; } = 0;
    public ICollection<SpecimenDto> Specimens { get; set; } = null!;
  }

  public class SpecimenDto
  {
    public int Id { get; set; }
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? StudBookName { get; set; }
    public string? RegisteredDate { get; set; }
    public string? BirthDate { get; set; }
    public string? InDate { get; set; }
    public string? InReasonCode { get; set; }
    public string? InReasonDisplayName { get; set; }
    public string? InLocationName { get; set; }
    public decimal? Price { get; set; }
    public int SpeciesId { get; set; }
    public string? OutDate { get; set; }
    public string? Name { get; set; }
    public string? Chip { get; set; }
    public string? RingNumber { get; set; }
    public string? Notch { get; set; }
    public bool? IsHybrid { get; set; }
    public string? Zims { get; set; }
    public string? StudBookNumber { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<IEnumerable<OrgLevelDTO>>>, NotFound>> Handle([FromBody] Request request, PziDbContext dbContext)
  {
    bool isVertebrata = request.Type?.ToLower() == "vertebrate";
    var today = DateTime.Today.ToString("yyyy/MM/dd");
    var specimens = await dbContext.Specimens
      .Include(sp => sp.OrgHierarchyView)
      .Include(sp => sp.Species)
      .Include(sp => sp.TaxonomyHierarchyView)
      .Include(sp => sp.InLocation)
      .Include(sp => sp.InReason)
      .Where(sp => sp.TaxonomyHierarchyView != null && sp.TaxonomyHierarchyView.IsVertebrate == isVertebrata
                   && (sp.OutDate == null || sp.OutDate == "")
                   && sp.InDate != null 
                   && string.Compare(sp.InDate, today) <= 0
                   && sp.Species != null && sp.Species.QuantityInZoo > 0)
      .ToListAsync();

    var orgLevelDtos = new Dictionary<int, OrgLevelDTO>();

    foreach (var specimen in specimens)
    {
      if (specimen.OrgHierarchyView == null) continue;

      var districtName = specimen.OrgHierarchyView.DistrictName ?? "";
      var departmentName = specimen.OrgHierarchyView.DepartmentName ?? "";
      var compositeKey = $"{districtName}|{departmentName}".GetHashCode();

      if (!orgLevelDtos.TryGetValue(compositeKey, out var orgLevelDto))
      {
        orgLevelDto = new OrgLevelDTO
        {
          Id = compositeKey,
          Name = districtName,
          SectionName = departmentName,
          Species = new List<SpeciesDto>()
        };
        orgLevelDtos[compositeKey] = orgLevelDto;
      }

      var speciesId = specimen.SpeciesId;
      var speciesList = (List<SpeciesDto>)orgLevelDto.Species;
      var speciesDto = speciesList.FirstOrDefault(s => s.Id == speciesId);

      if (speciesDto == null)
      {
        speciesDto = new SpeciesDto
        {
          Id = speciesId,
          NameCz = specimen.Species?.NameCz,
          NameLat = specimen.Species?.NameLat,
          CITES = specimen.Species?.CiteTypeCode,
          PriceTotal = 0m,
          Specimens = new List<SpecimenDto>()
        };
        speciesList.Add(speciesDto);
      }

      var specimenDto = new SpecimenDto
      {
        Id = specimen.Id,
        AccessionNumber = specimen.AccessionNumber,
        GenderTypeCode = specimen.GenderTypeCode,
        StudBookName = specimen.StudBookName,
        RegisteredDate = specimen.RegisteredDate,
        BirthDate = specimen.BirthDate,
        InDate = specimen.InDate,
        InReasonCode = specimen.InReasonCode,
        InReasonDisplayName = specimen.InReason != null ? specimen.InReason.DisplayName : null,
        InLocationName = specimen.InLocation == null ? "" : specimen.InLocation?.Keyword,
        Price = specimen.Price,
        SpeciesId = specimen.SpeciesId,
        OutDate = specimen.OutDate,
        Name = specimen.Name,
        RingNumber = specimen.RingNumber,
        IsHybrid = specimen.IsHybrid,
        Zims = specimen.Zims,
        Notch = specimen.Notch == null ? string.Empty : specimen.Notch.Trim(),
        Chip = specimen.Chip == null ? string.Empty : specimen.Chip.Trim(),
        StudBookNumber = specimen.StudBookNumber
      };

      ((List<SpecimenDto>)speciesDto.Specimens).Add(specimenDto);

      speciesDto.PriceTotal += specimen.Price ?? 0m;
    }

    var orgLevels = orgLevelDtos.Values.ToList();

    foreach (var orgLevel in orgLevels)
    {
      orgLevel.Species = orgLevel.Species
        .OrderBy(s => s.NameCz)
        .ToList();
    }

    if (!orgLevels.Any())
    {
      orgLevels.Add(new OrgLevelDTO
      {
        Id = 0,
        Name = "",
        SectionName = "Všechny exempláře",
        Species = new List<SpeciesDto>()
      });
    }



    return TypedResults.Ok(
      CommonDtos.SuccessResult<IEnumerable<OrgLevelDTO>>.FromItemAndFluentValidation(
        orgLevels,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
