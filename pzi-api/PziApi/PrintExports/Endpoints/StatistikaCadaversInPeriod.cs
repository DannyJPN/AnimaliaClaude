using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.Globalization;

namespace PziApi.PrintExports.Endpoints;

public class StatistikaCadaversByOrderRequest
{
  public string DateFrom { get; set; } = null!;
  public string DateTo { get; set; } = null!;
  public int? SpeciesId { get; set; }
  public string? LocationId { get; set; }
}

public class CadaverDetailDto
{
  public string? SpeciesLatinName { get; set; }
  public string? SpeciesCzechName { get; set; }
  public string? SpeciesName { get; set; }
  public int? SpeciesId { get; set; }
  public int? ExemplarId { get; set; }
  public string? CadaverDate { get; set; }
  public string? Location { get; set; }
  public string? CadaverNote { get; set; }
  public int? AccessionNumber { get; set; }
  public string? Gender { get; set; }
  public string? DeathDate { get; set; }
  public string? DeathType { get; set; }
  public string? DeathNote { get; set; }
}

public static class StatistikaCadaversInPeriod
{
  public class Validator : AbstractValidator<StatistikaCadaversByOrderRequest>
  {
    public Validator()
    {
      RuleFor(x => x.DateFrom).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
      RuleFor(x => x.DateTo).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY);
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<CadaverDetailDto[]>>, BadRequest<string>>> Handle(
    StatistikaCadaversByOrderRequest request,
    PziDbContext dbContext)
  {
    ValidationResult validationResult = new Validator().Validate(request);
    if (!validationResult.IsValid)
    {
      return TypedResults.BadRequest(validationResult.ToString());
    }

    var cadavers = await dbContext.Cadavers
      .Include(c => c.Specimen)
        .ThenInclude(s => s!.Species)
      .ToListAsync();

    var specimenIds = cadavers
      .Where(c => c.Specimen != null)
      .Select(c => c.SpecimenId)
      .Distinct()
      .ToList();

    // TODO: rework tables to use id as location not text in table Cadavers!
    var location = "";
    if(request.LocationId != null)
    {
      var cadaverLocation = await dbContext.CadaverPartners.FirstOrDefaultAsync(c => c.Id == int.Parse(request.LocationId));
      if (cadaverLocation != null)
      {
        location = cadaverLocation.Keyword;
      }
    }

    var deathMovements = await dbContext.Movements
      .Include(m => m.DecrementReason)
      .Where(m =>
        specimenIds.Contains(m.SpecimenId) &&
        m.DecrementReason != null &&
        new[]
        {
          "OUT01", // úhyn
          "OUT02", // mrtvě narozeno
          "OUT10", // škodná
          "OUT11", // euthanasie
          "OUT17", // zkrmeno
          "OUT22", // úhyn deponátu
          "OUT23"  // úbytek v deponaci
        }.Contains(m.DecrementReason.Code))
      .ToListAsync();

    var filteredCadavers = cadavers
      .Where(c =>
        c.Date != null &&
        string.Compare(c.Date, request.DateFrom) >= 0 &&
        string.Compare(c.Date, request.DateTo) <= 0 &&
        (!request.SpeciesId.HasValue || (c.Specimen != null && c.Specimen.SpeciesId == request.SpeciesId)) &&
        (string.IsNullOrWhiteSpace(location) || (c.Location != null && c.Location.Trim().ToLower() == location.Trim().ToLower())))
      .Select(c => new CadaverDetailDto
      {
        SpeciesLatinName = c.Specimen?.Species?.NameLat,
        SpeciesCzechName = c.Specimen?.Species?.NameCz,
        SpeciesName = c.Specimen?.Species != null
          ? $"{c.Specimen.Species.NameLat} ({c.Specimen.Species.NameCz})"
          : null,
        SpeciesId = c.Specimen?.SpeciesId ?? 0,
        ExemplarId = c.SpecimenId,
        CadaverDate = c.Date,
        Location = c.Location,
        CadaverNote = c.Note,
        AccessionNumber = c.Specimen?.AccessionNumber,
        Gender = c.Specimen?.GenderTypeCode,
        DeathDate = deathMovements
          .Where(m => m.SpecimenId == c.SpecimenId)
          .OrderBy(m => m.Date)
          .FirstOrDefault()
          ?.Date,
        DeathType = deathMovements
          .Where(m => m.SpecimenId == c.SpecimenId)
          .OrderBy(m => m.Date)
          .FirstOrDefault()
          ?.DecrementReason?.DisplayName,
        DeathNote = deathMovements
          .Where(m => m.SpecimenId == c.SpecimenId)
          .OrderBy(m => m.Date)
          .FirstOrDefault()
          ?.Note
      });

    // mode = kadaver
    if (string.IsNullOrWhiteSpace(request.LocationId) && string.IsNullOrWhiteSpace(request.SpeciesId.ToString()))
    {
      filteredCadavers = filteredCadavers.OrderBy(c => c.SpeciesCzechName, StringComparer.Create(CultureInfo.GetCultureInfo("cs-CZ"), true))
        .ThenBy(c => c.SpeciesLatinName)
        .ThenBy(c => c.CadaverDate);
    }
    else
    {
      filteredCadavers = filteredCadavers.OrderBy(c => c.CadaverDate);
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<CadaverDetailDto[]>.FromItemAndFluentValidation(
        filteredCadavers.ToArray(),
        new ValidationResult()
      )
    );
  }
}
