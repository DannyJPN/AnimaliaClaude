using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.Globalization;
using System.Linq.Expressions;

namespace PziApi.PrintExports.Endpoints;

public class FeedingDaysForFunding
{
  public record Request(string DateFrom, string DateTo);

  public record FundingProgramDto(string Name, SpeciesDto[] Species);

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? TaxonomyClassCode { get; set; }
    public string? ProtectionAreas { get; set; }
    public SpecimenDto[] Specimens { get; set; } = null!;
  }

  public class SpecimenDto
  {
    public int Id { get; set; }
    public int? AccessionNumber { get; set; }
    public string? Gender { get; set; }
    public string? Chip { get; set; }
    public string? RingNumber { get; set; }
    public int FeedingDays { get; set; }
    public string? History { get; set; }
    public int Quantity { get; set; }
  }

  private class MovementDto
  {
    public int SpecimenId { get; set; }
    public string? DecrementReason { get; set; }
    public string? IncrementReason { get; set; }
    public int Quantity { get; set; }
    public string Date { get; set; } = string.Empty;
  };

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.DateFrom)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("MinDate is not valid date (yyyy/MM/dd).");

      RuleFor(x => x.DateTo)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("MaxDate is not valid date (yyyy/MM/dd).");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<FundingProgramDto[]>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
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

    var protectionSpeciesDtos = await BuildSpeciesDtosAsync(
      dbContext,
      request,
      s => new[] { "SOH", "KOH", "OH" }.Contains(s.ProtectionTypeCode));

    var genePoolSpeciesDtos = await BuildSpeciesDtosAsync(
      dbContext,
      request,
      s => s.IsGenePool 
        && (s.ProtectionTypeCode == null || !new[] { "SOH", "KOH", "OH" }.Contains(s.ProtectionTypeCode)));

    var euSpeciesDtos = await BuildSpeciesDtosAsync(
      dbContext,
      request,
      s => s.IsGenePool == false 
        && (s.ProtectionTypeCode == null || !new[] { "SOH", "KOH", "OH" }.Contains(s.ProtectionTypeCode)) 
        && new[] { "A", "B" }.Contains(s.EuCode));

    var feedingDaysByFundings = new List<FundingProgramDto>()
    {
      new FundingProgramDto("EU", euSpeciesDtos.ToArray()),
      new FundingProgramDto("GENOFOND", genePoolSpeciesDtos.ToArray()),
      new FundingProgramDto("CRochrana", protectionSpeciesDtos.ToArray()),
    };

    return TypedResults.Ok(
        CommonDtos.SuccessResult<FundingProgramDto[]>.FromItemAndFluentValidation(
            feedingDaysByFundings.ToArray(),
            new FluentValidation.Results.ValidationResult()
        )
    );
  }

  private static async Task<List<SpeciesDto>> BuildSpeciesDtosAsync(
    PziDbContext dbContext,
    Request request,
    Expression<Func<Models.Species, bool>> speciesFilter)
  {
    var dtFrom = DateTimeHelpers.ExtractDate(request.DateFrom);
    var dtTo = DateTimeHelpers.ExtractDate(request.DateTo);

    var phylaIds = await dbContext.TaxonomyPhyla
      .Where(p => p.IsVertebrate)
      .Select(p => p.Id)
      .ToArrayAsync();

    // STEP 1: Filter species by category
    var filteredSpecies = await dbContext.Species
    .AsNoTracking()
    .Where(speciesFilter)
    .Where(s => phylaIds.Contains(s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylumId!.Value))
    .Select(s => new
    {
      s.Id,
      s.NameCz,
      s.NameLat,
      s.ProtectionTypeCode,
      s.IsGenePool,
      s.EuCode,
      s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.Code
    })
    .ToListAsync();

    if (filteredSpecies.Count == 0)
      return new List<SpeciesDto>();

    var speciesIds = filteredSpecies.Select(s => s.Id).ToList();

    // STEP 2: Get valid specimens for the filtered species only
    var validSpecimens = await dbContext.Specimens
        .AsNoTracking()
        .Where(sp =>
            speciesIds.Contains(sp.SpeciesId) &&
            !string.IsNullOrEmpty(sp.InDate) &&
            string.Compare(sp.InDate, request.DateTo) < 0 &&
            (
                string.IsNullOrEmpty(sp.OutDate) ||
                string.Compare(request.DateFrom, sp.OutDate) <= 0
            ))
        .ToListAsync();

    if (validSpecimens.Count == 0)
      return new List<SpeciesDto>();

    var specimenIds = validSpecimens.Select(sp => sp.Id).ToList();

    // STEP 3: Load movements only for relevant specimens
    var movementsDictionary = await dbContext.Movements
        .AsNoTracking()
        .Where(m => specimenIds.Contains(m.SpecimenId))
        .Where(m => string.Compare(m.Date, request.DateTo) <= 0 && m.IncrementReasonCode != "IN02")
        .Select(m => new MovementDto
        {
          SpecimenId = m.SpecimenId,
          Date = m.Date,
          Quantity = m.Quantity,
          IncrementReason = m.IncrementReason != null ? m.IncrementReason.DisplayName : null,
          DecrementReason = m.DecrementReason != null ? m.DecrementReason.DisplayName : null
        })
        .GroupBy(m => m.SpecimenId)
        .ToDictionaryAsync(m => m.Key, m => m.OrderBy(m => m.Date).ToList());

    var specimensBySpecies = validSpecimens
        .GroupBy(sp => sp.SpeciesId)
        .ToDictionary(g => g.Key, g => g.ToList());

    var speciesDtos = new List<SpeciesDto>();

    foreach (var species in filteredSpecies)
    {
      if (!specimensBySpecies.TryGetValue(species.Id, out var speciesSpecimens))
        continue;

      var specimenDtos = new List<SpecimenDto>();

      foreach (var specimen in speciesSpecimens)
      {
        if (!movementsDictionary.TryGetValue(specimen.Id, out var specimenMovements) || specimenMovements.Count == 0)
          continue;

        int feedingDays = 0, quantity = 0;
        string history = "", prevDate = "", prevIncrement = "", prevDecrement = "";
        int prevQuantity = 0;

        foreach (var movement in specimenMovements)
        {
          int diff;
          
          if (!DateTimeHelpers.TryToExtractDate(movement.Date, out DateTime movementDate))
          {
            continue;
          }

          if (movement.Date.CompareTo(request.DateFrom) < 0)
          {
            diff = (dtTo - dtFrom)!.Value.Days + 1;
          }
          else
          {
            diff = (dtTo - movementDate)!.Value.Days;
            if (!string.IsNullOrEmpty(movement.IncrementReason))
              diff++;
          }

          if (!string.IsNullOrEmpty(prevDate))
          {
            var prevDateTime = DateTimeHelpers.ExtractDate(prevDate);
            if (prevDateTime.HasValue)
            {
              history += $"|{prevDate}:{prevQuantity}:{(movementDate - prevDateTime).Value.Days}:{prevIncrement}{prevDecrement}";
            }
          }

          prevDate = movement.Date;
          prevQuantity = movement.Quantity;
          quantity = quantity == 0 ? movement.Quantity : quantity;

          if (!string.IsNullOrEmpty(movement.IncrementReason))
          {
            feedingDays += movement.Quantity * diff;
            prevIncrement = movement.IncrementReason ?? "";
            prevDecrement = "";
          }
          else
          {
            feedingDays -= movement.Quantity * diff;
            prevDecrement = movement.DecrementReason ?? "";
            prevIncrement = "";
          }
        }

        if (!string.IsNullOrEmpty(prevDate))
        {
          var prevDateTime = DateTimeHelpers.ExtractDate(prevDate);
          if (prevDateTime != null && dtTo != null)
          {
            history += $"|{prevDate}:{prevQuantity}:{(dtTo.Value - prevDateTime.Value).Days}:{prevIncrement}{prevDecrement}|";
          }
        }

        if (feedingDays > 0)
        {
          specimenDtos.Add(new SpecimenDto
          {
            Id = specimen.Id,
            AccessionNumber = specimen.AccessionNumber,
            Gender = specimen.ClassificationTypeCode == "S" ? "S" : specimen.GenderTypeCode,
            Chip = string.IsNullOrEmpty(specimen.Chip) ? "" : specimen.Chip.Trim(),
            RingNumber = specimen.RingNumber,
            FeedingDays = feedingDays,
            History = history,
            Quantity = quantity
          });
        }
      }

      if (specimenDtos.Count > 0)
      {
        var protectionLevel = new List<string>();
        if (!string.IsNullOrEmpty(species.EuCode) && (species.EuCode == "A" || species.EuCode == "B"))
          protectionLevel.Add($"EU={species.EuCode}");
        if (!string.IsNullOrEmpty(species.ProtectionTypeCode) &&
          (species.ProtectionTypeCode == "SOH" || species.ProtectionTypeCode == "KOH" || species.ProtectionTypeCode == "OH"))
          protectionLevel.Add($"CRochrana={species.ProtectionTypeCode}");
        if (species.IsGenePool)
          protectionLevel.Add("GENOFOND=ano");

        speciesDtos.Add(new SpeciesDto
        {
          Id = species.Id,
          NameCz = species.NameCz,
          NameLat = species.NameLat,
          TaxonomyClassCode = species.Code,
          ProtectionAreas = string.Join(",", protectionLevel),
          Specimens = specimenDtos.OrderBy(sp => sp.AccessionNumber).ToArray()
        });
      }
    }

    return speciesDtos.OrderBy(sp => sp.TaxonomyClassCode)
      .ThenBy(sp => sp.NameCz, StringComparer.Create(CultureInfo.GetCultureInfo("cs-CZ"), true))
      .ThenBy(sp => sp.NameLat)
      .ToList();
  }
}
