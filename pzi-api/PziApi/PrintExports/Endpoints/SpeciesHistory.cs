using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpeciesHistory
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
    public string? Rearing { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesDto>>, NotFound>> Handle(int speciesId, [FromQuery] string? fromDate, [FromQuery] string? toDate, PziDbContext dbContext)
  {
    var speciesResult = await dbContext.Species
      .Where(s => s.Id == speciesId)
      .OrderBy(s => s.NameCz)
      .ThenBy(s => s.Id)
      .Select(s => new SpeciesDto
      {
        Id = s.Id,
        NameCz = s.NameCz!,
        NameLat = s.NameLat!
      })
      .SingleOrDefaultAsync();

    if (speciesResult == null)
      return TypedResults.NotFound();

    var specimensQuery = dbContext.Specimens
        .Where(sp => sp.SpeciesId == speciesResult.Id);

    if (!string.IsNullOrEmpty(fromDate) || !string.IsNullOrEmpty(toDate))
    {
      specimensQuery = specimensQuery.Where(sp =>
          (sp.InDate != null &&
           (string.IsNullOrEmpty(fromDate) || sp.InDate.CompareTo(fromDate) >= 0) &&
           (string.IsNullOrEmpty(toDate) || sp.InDate.CompareTo(toDate) <= 0)
          )
          ||
          (sp.OutDate != null &&
           (string.IsNullOrEmpty(fromDate) || sp.OutDate.CompareTo(fromDate) >= 0) &&
           (string.IsNullOrEmpty(toDate) || sp.OutDate.CompareTo(toDate) <= 0)
          )
      );
    }

    var specimensResult = await specimensQuery
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
          Notch = sp.Notch != null ? sp.Notch.Trim() : "",
          Chip = sp.Chip != null ? sp.Chip.Trim() : "",
          RingNumber = sp.RingNumber,
          FatherAccessionNumber = sp.Father!.AccessionNumber,
          MotherAccessionNumber = sp.Mother!.AccessionNumber,
          InDate = sp.InDate,
          InReasonCode = sp.InReasonCode,
          InReasonDisplayName = sp.InReason!.DisplayName,
          InLocationName = sp.InLocation!.Keyword,
          OutDate = sp.OutDate,
          OutReasonCode = sp.OutReasonCode,
          OutReasonDisplayName = sp.OutReason!.DisplayName,
          OutLocationName = sp.OutLocation!.Keyword,
          Rearing = sp.Rearing
        }).ToArrayAsync();

    speciesResult.Specimens = specimensResult;

    return TypedResults.Ok(
      CommonDtos.SuccessResult<SpeciesDto>.FromItemAndFluentValidation(
        speciesResult,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
