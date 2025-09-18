// Sestavy / Zoologie - CR rozhodnuti - podle data pohybu

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.Globalization;

namespace PziApi.PrintExports.Endpoints;

public class CRDecisionByMovementDate
{
  public class CRDecisionByMovementDateRequest
  {
    public string? MinDate { get; set; }
    public string? MaxDate { get; set; }
    public string Mode { get; set; } = null!;
  }

  public class CRDecisionDto
  {
    public required string Decision { get; set; }
    public SpecimenMovementDto[] Movements { get; set; } = null!;
  }

  public class SpecimenMovementDto
  {
    public string? Date { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? Gender { get; set; }
    public int? AccessionNumber { get; set; }
    public string? Chip { get; set; }
    public string? RingNumber { get; set; }
    public string? CzechRegistrationNumber { get; set; }
    public string? MovementType { get; set; }
    public string? Direction { get; set; }
    public string? Note { get; set; }
    public string? Invert { get; set; } = string.Empty;
    public string? Keyword { get; set; }
    public string? Decision { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<CRDecisionDto[]>>, BadRequest<string>, NotFound>> Handle(
      [FromBody] CRDecisionByMovementDateRequest request,
      PziDbContext dbContext)
  {
    var minDate = string.IsNullOrEmpty(request.MinDate) ? DateTime.UtcNow.ToString("yyyy/MM/dd") : request.MinDate;
    var maxDate = string.IsNullOrEmpty(request.MaxDate) ? DateTime.UtcNow.ToString("yyyy/MM/dd") : request.MaxDate;

    if (string.Compare(request.MinDate, request.MaxDate) > 0)
    {
      return TypedResults.BadRequest("MinDate cannot be greater than MaxDate.");
    }

    var speciesQuery = dbContext.Species.AsQueryable();

    if (request.Mode == "decisioneu")
      speciesQuery = speciesQuery.Where(s => !string.IsNullOrWhiteSpace(s.EuFaunaRefNumber));
    else if (request.Mode == "decisioncr")
      speciesQuery = speciesQuery.Where(s => !string.IsNullOrWhiteSpace(s.CrExceptionRefNumber));
    else
      return TypedResults.NotFound();

    speciesQuery = speciesQuery.Where(s => s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum!.IsVertebrate);

    var movements = await dbContext.Movements
      .Join(speciesQuery, m => m.Specimen!.SpeciesId, sp => sp.Id, (m, sp) => new { m, sp })
      .Where(q => q.sp.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum!.IsVertebrate)
      .Where(q => q.m.Date != null &&
                q.m.Date.Length >= 4 &&
                string.Compare(q.m.Date, minDate) >= 0 &&
                string.Compare(q.m.Date, maxDate) <= 0)
      .Select(x => new SpecimenMovementDto
      {
        Date = x.m.Date,
        NameCz = x.sp.NameCz,
        NameLat = x.sp.NameLat,
        Gender = x.m.Specimen!.GenderType == null ? string.Empty : x.m.Specimen.GenderType.Code,
        AccessionNumber = x.m.Specimen!.AccessionNumber,
        Chip = x.m.Specimen.Chip == null ? string.Empty : x.m.Specimen.Chip.Trim(),
        RingNumber = x.m.Specimen!.RingNumber,
        CzechRegistrationNumber = x.m.Specimen!.CzechRegistrationNumber,
        MovementType = x.m.IncrementReason != null ? x.m.IncrementReason.DisplayName : x.m.DecrementReason != null ? x.m.DecrementReason.DisplayName : string.Empty,
        Direction = x.m.IncrementReason != null ? "+" : "-",
        Keyword = x.m.Partner != null ? x.m.Partner.Keyword : string.Empty,
        Note = x.m.Note,
        Decision = request.Mode == "decisioneu" ? x.sp.EuFaunaRefNumber : x.sp.CrExceptionRefNumber
      })
      .ToListAsync();

    var result = movements
      .GroupBy(g => g.Decision)
      .Select(g => new CRDecisionDto
      {
        Decision = g.Key!,
        Movements = g.OrderBy(x => x.Decision)
          .ThenBy(x => x.Date)
          .ThenBy(x => x.NameCz, StringComparer.Create(CultureInfo.GetCultureInfo("cs-CZ"), true))
          .ThenBy(x => x.AccessionNumber)
          .ThenBy(x => x.MovementType)
          .ToArray()
      })
      .ToList();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<CRDecisionDto[]>.FromItemAndFluentValidation(
            result.OrderBy(x => x.Decision).ToArray(),
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
