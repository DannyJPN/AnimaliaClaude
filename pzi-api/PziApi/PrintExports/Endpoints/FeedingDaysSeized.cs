using FluentValidation;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.PrintExports.Endpoints;

public static class FeedingDaysSeized
{
  public record Request(string MinDate, string MaxDate, bool Vertebrata);

  public record SpeciesInfoDto(
    int Id,
    string? NameCz,
    string? NameLat,
    string? Ochrana,
    List<SpecimenInfoDto> Specimens);

  public record SpecimenInfoDto(
    int Id,
    int? AccessionNumber,
    string? GenderTypeCode,
    string? Chip,
    string? RingNumber,
    string? IncrementDate,
    string? IncrementPlace,
    int Quantity,
    int FeedingDays,
    string History);

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.MinDate)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("MinDate is not valid date (yyyy/MM/dd).");

      RuleFor(x => x.MaxDate)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("MaxDate is not valid date (yyyy/MM/dd).");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesInfoDto[]>>, NotFound, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    var validator = new RequestValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var minDate = request.MinDate;
    var maxDate = request.MaxDate;

    var phylaIds = await dbContext.TaxonomyPhyla
          .Where(p => p.IsVertebrate == request.Vertebrata)
          .Select(p => p.Id)
          .ToArrayAsync();

    var seizedSpecimensInZooAtTime = await dbContext.Specimens
          .Where(s => phylaIds.Contains(s.TaxonomyHierarchyView!.PhylumId))
          .Where(s => s.Movements!.Any(m => string.Compare(m.Date, maxDate) <= 0 && m.IncrementReasonCode == "IN09"))
          .Where(s => !s.Movements!.Any(m => string.Compare(m.Date, minDate) <= 0
              && (m.IncrementReasonCode == "IN08" || m.IncrementReasonCode == "IN02" || !string.IsNullOrEmpty(m.DecrementReasonCode))))
          .Where(s => string.Compare(s.InDate, maxDate) <= 0)
          .Where(s => string.IsNullOrEmpty(s.OutDate) || string.Compare(s.OutDate, minDate) >= 0)
          .Select(s => new
          {
            s.Id,
            s.AccessionNumber,
            s.GenderTypeCode,
            s.Chip,
            s.RingNumber,
            s.SpeciesId,
            s.InDate,
            InLocationName = s.InLocation!.Keyword,
            SpeciesNameCz = s.Species!.NameCz,
            SpeciesNameLat = s.Species.NameLat,
            SpeciesIsEep = s.Species.IsEep,
            SpeciesIsEsb = s.Species.IsEsb,
            SpeciesIsIsb = s.Species.IsIsb,
            SpeciesProtectionTypeCode = s.Species.ProtectionTypeCode,
            SpeciesRdbCode = s.Species.RdbCode,
            SpeciesCiteTypeCode = s.Species.CiteTypeCode,
            SpeciesEuCode = s.Species.EuCode
          })
          .ToArrayAsync();

    var speciesData = seizedSpecimensInZooAtTime
            .GroupBy(s => s.SpeciesId)
            .Select(g => new
            {
              SpeciesId = g.Key,
              SpeciesNameCz = g.First().SpeciesNameCz,
              SpeciesNameLat = g.First().SpeciesNameLat,
              SpeciesIsEep = g.First().SpeciesIsEep,
              SpeciesIsEsb = g.First().SpeciesIsEsb,
              SpeciesIsIsb = g.First().SpeciesIsIsb,
              SpeciesProtectionTypeCode = g.First().SpeciesProtectionTypeCode,
              SpeciesRdbCode = g.First().SpeciesRdbCode,
              SpeciesCiteTypeCode = g.First().SpeciesCiteTypeCode,
              SpeciesEuCode = g.First().SpeciesEuCode,
              SpecimenData = g.Select(e => new
              {
                e.Id,
                e.AccessionNumber,
                e.GenderTypeCode,
                e.Chip,
                e.RingNumber,
                e.SpeciesId,
                e.InDate,
                e.InLocationName
              }).OrderBy(e => e.AccessionNumber).ToArray(),
              SpecimenIds = g.Select(e => e.Id).ToArray()
            })
            .ToArray();

    var allSpecimenIds = speciesData
            .SelectMany(s => s.SpecimenIds)
            .ToArray();

    var allRelevantMovements = await dbContext.Movements
            .Include(m => m.IncrementReason)
            .Include(m => m.DecrementReason)
            .Where(m => allSpecimenIds.Contains(m.SpecimenId))
            .Where(m => string.Compare(m.Date, maxDate) <= 0)
            .ToArrayAsync();

    var grouppedMovements = allRelevantMovements
          .GroupBy(m => m.SpecimenId)
          .ToDictionary(
            g => g.Key,
            g => g.OrderBy(m => m.Date).ToList()
          );

    var resultSpeciesData = speciesData
              .OrderBy(spc => spc.SpeciesNameCz)
              .Select(spc =>
              {
                var protectionString =
                  (spc.SpeciesIsEep ? "EEP," : "") +
                  (spc.SpeciesIsEsb ? "ESB," : "") +
                  (spc.SpeciesIsIsb ? "ISB," : "") +
                  (!string.IsNullOrEmpty(spc.SpeciesProtectionTypeCode) ? $"CRochrana={spc.SpeciesProtectionTypeCode}," : "") +
                  (!string.IsNullOrEmpty(spc.SpeciesRdbCode) ? $"RDB={spc.SpeciesRdbCode}," : "") +
                  (!string.IsNullOrEmpty(spc.SpeciesCiteTypeCode) ? $"CITES={spc.SpeciesCiteTypeCode}," : "") +
                  (!string.IsNullOrEmpty(spc.SpeciesEuCode) ? $"EU={spc.SpeciesEuCode}," : "");

                var specimensInfo = new List<SpecimenInfoDto>();

                foreach (var specimen in spc.SpecimenData)
                {
                  var (feedingDays, seizedQuantity) = CalculateFeedingDays(specimen.Id, minDate, maxDate, grouppedMovements);

                  if (feedingDays <= 0)
                  {
                    continue;
                  }

                  var specimenInfo = new SpecimenInfoDto(
                     Id: specimen.Id,
                     AccessionNumber: specimen.AccessionNumber,
                     GenderTypeCode: specimen.GenderTypeCode,
                     Chip: specimen.Chip,
                     RingNumber: specimen.RingNumber,
                     IncrementDate: specimen.InDate,
                     IncrementPlace: specimen.InLocationName,
                     Quantity: seizedQuantity,
                     FeedingDays: feedingDays,
                     History: GenerateMovementHistory(specimen.Id, minDate, maxDate, feedingDays, grouppedMovements)
                   );

                  specimensInfo.Add(specimenInfo);
                }

                return new SpeciesInfoDto(
                  Id: spc.SpeciesId,
                  NameCz: spc.SpeciesNameCz,
                  NameLat: spc.SpeciesNameLat,
                  Ochrana: protectionString,
                  Specimens: specimensInfo
                );
              })
              .ToArray();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<SpeciesInfoDto[]>.FromItemAndFluentValidation(
        resultSpeciesData,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }

  /// <summary>
  /// Vypočítá počet krmných dnů pro zadaný exemplář v zadaném období
  /// </summary>
  private static (int feedingDays, int seizedQuantity) CalculateFeedingDays(
    int specimenId, string minDate, string maxDate, Dictionary<int, List<Movement>> movementsDictionary)
  {
    int feedingDays = 0;

    // Kontrola, zda exemplář má pohyby
    if (!movementsDictionary.TryGetValue(specimenId, out var movements) || movements.Count == 0)
    {
      return (0, 0);
    }

    // Najít přírustek "zabaveno" - pohyby jsou již předfiltrovány v Handle
    var seizureMovement = movements
      .FirstOrDefault(m => m.IncrementReasonCode == "IN09");

    if (seizureMovement == null)
    {
      return (0, 0);
    }

    // Určení počáteční kvantity a data
    int quantity = seizureMovement.Quantity;
    string startDate = DateTimeHelpers.ExtractDateString(seizureMovement.Date);

    // Pokud je počáteční datum před minDate, použijeme minDate
    if (string.Compare(startDate, minDate) < 0)
    {
      startDate = minDate;
    }

    // Nalezení všech pohybů po zabavení - použijeme už otříděné pohyby z movementsDictionary
    var laterMovements = movements
      .Where(m => string.Compare(DateTimeHelpers.ExtractDateString(m.Date), startDate) > 0 &&
                string.Compare(DateTimeHelpers.ExtractDateString(m.Date), maxDate) <= 0)
      .OrderBy(m => m.Date)
      .ToList();

    // Pokud nejsou žádné další pohyby, počítáme dny od startDate do maxDate
    if (laterMovements.Count == 0)
    {
      feedingDays = DateTimeHelpers.CalculateDaysDifference(startDate, maxDate) + 1;
    }
    else
    {
      string currentDate = startDate;

      // Zpracovat každý následující pohyb
      foreach (var movement in laterMovements)
      {
        string movementDate = DateTimeHelpers.ExtractDateString(movement.Date);
        int days = DateTimeHelpers.CalculateDaysDifference(currentDate, movementDate) + 1;

        feedingDays += days * quantity;

        // Aktualizovat kvantitu podle pohybu
        if (!string.IsNullOrEmpty(movement.IncrementReasonCode))
        {
          quantity += movement.Quantity;
        }
        else if (!string.IsNullOrEmpty(movement.DecrementReasonCode))
        {
          quantity -= movement.Quantity;
        }

        currentDate = movementDate;

        // Pokud je po pohybu kvantita 0, končíme výpočet
        if (quantity <= 0)
        {
          break;
        }
      }

      // Pokud exemplář stále existuje (quantity > 0), připočítáme dny od posledního pohybu do maxDate
      if (quantity > 0 && string.Compare(currentDate, maxDate) < 0)
      {
        int remainingDays = DateTimeHelpers.CalculateDaysDifference(currentDate, maxDate) + 1;
        feedingDays += remainingDays * quantity;
      }
    }

    return (feedingDays, seizureMovement.Quantity);
  }

  /// <summary>
  /// Generuje historii pohybů pro zadaný exemplář v daném období
  /// </summary>
  private static string GenerateMovementHistory(
    int specimenId, string minDate, string maxDate, int feedingDays, Dictionary<int, List<Movement>> movementsDictionary)
  {
    // Kontrola, zda exemplář má pohyby - stejná podmínka jako v CalculateFeedingDays
    if (!movementsDictionary.TryGetValue(specimenId, out var movements) || movements.Count == 0)
    {
      return string.Empty;
    }

    // Najít přírustek "zabaveno" - pohyby jsou již předfiltrovány v Handle
    var seizureMovement = movements
      .FirstOrDefault(m => m.IncrementReasonCode == "IN09");

    if (seizureMovement == null)
    {
      return string.Empty;
    }

    int quantity = seizureMovement.Quantity;

    var startDate = string.Compare(seizureMovement.Date, minDate) < 0
      ? minDate
      : seizureMovement.Date;

    var outMovement = movements.FirstOrDefault(m => !string.IsNullOrEmpty(m.DecrementReasonCode) && string.Compare(m.Date, maxDate) <= 0);
    var outDate = outMovement == null ? maxDate : outMovement.Date;

    var outMovementString = outMovement == null ? "" : $"'{outMovement.DecrementReason!.DisplayName}'";

    return $"{startDate}|{outDate}:{quantity}:{feedingDays}:{outMovementString}";
  }
}
