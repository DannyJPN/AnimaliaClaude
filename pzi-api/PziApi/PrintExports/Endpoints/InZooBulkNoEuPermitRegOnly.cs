using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class InZooBulkNoEuPermitRegOnly
{
  public record Request(int ClassId);

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? Cites { get; set; }
    public bool IsRegulationRequirement { get; set; }
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
    var supportedStatuses = new[] { "Z" };

    var query = dbContext.Species
      .Include(s => s.Region)
      .Where(s => supportedStatuses.Contains(s.ZooStatus));

    query = query.Where(s => s.EuCode == "A" && s.IsRegulationRequirement);

    var speciesResult = await query
      .OrderBy(s => s.NameCz)
      .ThenBy(s => s.Id)
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

    var specimensResult = await dbContext.Specimens
        .Where(sp => sp.TaxonomyHierarchyView!.ClassId == request.ClassId)
        .Where(sp => speciesIds.Contains(sp.SpeciesId)
              && string.IsNullOrEmpty(sp.OutDate)
              && sp.QuantityInZoo > 0
              && string.IsNullOrEmpty(sp.EuPermit)
        )
        .OrderBy(sp => sp.AccessionNumber)
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
          InDate = sp.InDate,
          InReasonCode = sp.InReasonCode,
          InReasonDisplayName = sp.InReason!.DisplayName,
          InLocationName = sp.InLocation!.Keyword,
          Price = sp.Price,
          SpeciesId = sp.SpeciesId,
          RegionName = sp.OrgHierarchyView != null ? sp.OrgHierarchyView.DistrictName : null
        }).ToArrayAsync();

    foreach (var species in speciesResult)
    {
      var specimens = specimensResult
                          .Where(specimen => specimen.SpeciesId == species.Id)
                          .ToArray();
      species.Specimens = specimens;
      species.Price = specimens.Sum(x => x.Price);
    }

    var finalResult = speciesResult.Where(s => s.Specimens.Any()).ToArray();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<SpeciesDto[]>.FromItemAndFluentValidation(
        finalResult,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}