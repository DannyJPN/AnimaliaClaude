using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpecimenCardCrEvidence
{
  public record Request(
    int? SpecimenId);

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
  }

  public class ParentDto
  {
    public int Id { get; set; }
    public string? Zims { get; set; }
    public int? AccessionNumber { get; set; }
    public string? CzechRegistrationNumber { get; set; }
  }

  public class SpecimenDto
  {
    public SpeciesDto? Species { get; set; }
    public int Id { get; set; }
    public string? GenderTypeCode { get; set; }
    public int? AccessionNumber { get; set; }
    public string? Chip { get; set; }
    public string? RingNumber { get; set; }
    public string? BirthDate { get; set; }
    public string? BirthPlace { get; set; }
    public ParentDto? Mother { get; set; }
    public ParentDto? Father { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpecimenDto>>, NotFound>> Handle([FromBody] Request request, PziDbContext dbContext)
  {
    var specimenId = request.SpecimenId;

    var specimen = await dbContext.Specimens
        .Include(s => s.Species)
        .Include(s => s.Father)
        .Include(s => s.Mother)
        .Where(sp =>
        (specimenId.HasValue && sp.Id == specimenId)
    ).FirstOrDefaultAsync();

    if (specimen == null)
    {
      return TypedResults.Ok(
        CommonDtos.SuccessResult<SpecimenDto>.FromItemAndFluentValidation(
            new SpecimenDto(),
            new FluentValidation.Results.ValidationResult()
        ));
    }

    var dto = new SpecimenDto
    {
      Species = specimen.Species == null ? null : new SpeciesDto
      {
        Id = specimen.Species.Id,
        NameCz = specimen.Species.NameCz,
        NameLat = specimen.Species.NameLat
      },
      Id = specimen.Id,
      AccessionNumber = specimen.AccessionNumber,
      GenderTypeCode = specimen.GenderTypeCode,
      Chip = string.IsNullOrEmpty(specimen.Chip) ? "" : specimen.Chip.Trim(),
      RingNumber = string.IsNullOrEmpty(specimen.RingNumber) ? "" : specimen.RingNumber.Trim(),
      BirthDate = specimen.BirthDate,
      BirthPlace = specimen.BirthPlace,
      Mother = specimen.Mother == null ? null : new ParentDto
      {
        Id = specimen.Mother.Id,
        Zims = specimen.Mother.Zims,
        AccessionNumber = specimen.Mother.AccessionNumber,
        CzechRegistrationNumber = specimen.Mother.CzechRegistrationNumber
      },
      Father = specimen.Father == null ? null : new ParentDto
      {
        Id = specimen.Father.Id,
        Zims = specimen.Father.Zims,
        AccessionNumber = specimen.Father.AccessionNumber,
        CzechRegistrationNumber = specimen.Father.CzechRegistrationNumber
      },
    };

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpecimenDto>.FromItemAndFluentValidation(
            dto,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
