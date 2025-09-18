/* ZA-37 -> Sestavy / Programy: Druhy - Druh v majetku */

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

// TODO REVIEW AND COMPARE WITH InZooStatus 
public class SpeciesInZoo
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
    public string? Rearing { get; set; }
    public int? FatherAccessionNumber { get; set; }
    public int? MotherAccessionNumber { get; set; }
    public string? InDate { get; set; }
    public string? InReasonCode { get; set; }
    public string? InReasonDisplayName { get; set; }
    public string? InLocationName { get; set; }
    public string? OutDate { get; set; }
    public string? OutReasonCode { get; set; }
    public string? OutReasonDisplayName { get; set; }
    public string? OutLocationName { get; set; }
    public string? PlacementName { get; set; }
    public string? PlacementNote { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesDto>>, NotFound>> Handle(int speciesId, PziDbContext dbContext)
  {
    var speciesResult = await dbContext.Species
      .Where(s => s.ZooStatus == "Z" || s.ZooStatus == "D")
      .Where(s => s.Id == speciesId)
      .OrderBy(s => s.NameCz)
      .ThenBy(s => s.Id)
      .Select(s => new SpeciesDto
      {
        Id = s.Id,
        NameCz = s.NameCz,
        NameLat = s.NameLat
      })
      .SingleOrDefaultAsync();

    if (speciesResult == null)
      return TypedResults.NotFound();

    var specimensResult = await dbContext.Specimens
      .Where(sp => sp.SpeciesId == speciesResult.Id
        && (string.IsNullOrEmpty(sp.OutDate))
        && (!string.IsNullOrEmpty(sp.InDate)))
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
        BirthDate = sp.BirthDate,
        Rearing = sp.Rearing,
        Notch = sp.Notch,
        Chip = string.IsNullOrEmpty(sp.Chip) ? "" : sp.Chip.Trim(),
        RingNumber = string.IsNullOrEmpty(sp.RingNumber) ? "" : sp.RingNumber.Trim(),
        FatherAccessionNumber = sp.Father!.AccessionNumber,
        MotherAccessionNumber = sp.Mother!.AccessionNumber,
        InDate = sp!.InDate,
        InReasonCode = sp.InReasonCode,
        InReasonDisplayName = sp.InReason!.DisplayName,
        InLocationName = sp.InLocation!.Keyword,
        OutDate = sp.OutDate,
        OutReasonCode = sp.OutReasonCode,
        OutReasonDisplayName = sp.OutReason!.DisplayName,
        OutLocationName = sp.OutLocation!.Keyword,
      })
      .ToArrayAsync();

    if (specimensResult == null || !specimensResult.Any())
    {
      speciesResult.Specimens = Array.Empty<SpecimenDto>();

      return TypedResults.Ok(
        CommonDtos.SuccessResult<SpeciesDto>.FromItemAndFluentValidation(
          speciesResult,
          new FluentValidation.Results.ValidationResult()
        )
      );
    }

    var specimenIds = specimensResult.Select(sp => sp.Id).ToArray();

    var latestPlacements = await dbContext.SpecimenPlacements
      .Where(sp => specimenIds.Contains(sp.SpecimenId))
      .GroupBy(sp => sp.SpecimenId)
      .Select(g => g.OrderByDescending(sp => sp.ValidSince)
        .Select(sp => new
        {
          SpecimenId = sp.SpecimenId,
          LocationName = sp.OrganizationLevel != null ? sp.OrganizationLevel.Name : "",
          ValidSince = sp.ValidSince,
          Note = sp.Note
        })
        .FirstOrDefault())
      .ToDictionaryAsync(x => x!.SpecimenId);

    foreach (var specimen in specimensResult)
    {
      if (latestPlacements.TryGetValue(specimen.Id, out var placement))
      {
        specimen.PlacementName = placement!.LocationName;
        specimen.PlacementNote = placement.Note;
      }
    }

    speciesResult.Specimens = specimensResult;

    return TypedResults.Ok(
      CommonDtos.SuccessResult<SpeciesDto>.FromItemAndFluentValidation(
        speciesResult,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
