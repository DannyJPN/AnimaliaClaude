using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class CREvidenceByMovementDate
{
  public class CREvidenceByMovementDateRequest
  {
    public string MinDate { get; set; } = null!;
    public string MaxDate { get; set; } = null!;
    public string Mode { get; set; } = "crprotection"; // Default to CR ochrana (using enum value)
  }

  // No wrapper DTO needed since we'll return flat list of movements

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
    public string? PartnerName { get; set; }
    public string? Note { get; set; }
    public string? Invert { get; set; } = string.Empty;
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpecimenMovementDto[]>>, BadRequest<string>, NotFound>> Handle(
      [FromBody] CREvidenceByMovementDateRequest request,
      PziDbContext dbContext)
  {
    if (string.IsNullOrEmpty(request.MinDate) || string.IsNullOrEmpty(request.MaxDate))
    {
      return TypedResults.BadRequest("MinDate and MaxDate are required parameters");
    }

    // Extract years from the min and max dates for pre-filtering
    string minYear = "";
    if (!string.IsNullOrEmpty(request.MinDate))
    {
      string[] minParts = request.MinDate.Split('/');
      if (minParts.Length > 0)
        minYear = minParts[0];
    }

    string maxYear = "9999"; // Default to a far future year if not specified
    if (!string.IsNullOrEmpty(request.MaxDate))
    {
      string[] maxParts = request.MaxDate.Split('/');
      if (maxParts.Length > 0)
        maxYear = maxParts[0];
    }

    // Základní filtry pro všechny módy s projekcí potřebných vlastností
    var query = dbContext.Movements
        .Where(m => m.Specimen != null && m.Specimen.Species != null)
        .Where(m => m.Date != null &&
                  m.Date.Length >= 4 &&
                  string.Compare(m.Date.Substring(0, 4), minYear) >= 0 &&
                  string.Compare(m.Date.Substring(0, 4), maxYear) <= 0)
        .Select(m => new
        {
          Movement = m,
          Specimen = m.Specimen,
          Species = m.Specimen!.Species,
          GenderType = m.Specimen.GenderType,
          IncrementReason = m.IncrementReason,
          DecrementReason = m.DecrementReason,
          Partner = m.Partner
        });

    // Parse the mode enum from EnumMember value using TryParse
    // This automatically uses the [EnumMember] attributes to match string values
    if (!Enum.TryParse<InZooFilterEnum>(request.Mode, true, out var modeEnum))
    {
      // Default to CR protection if parsing fails
      modeEnum = InZooFilterEnum.CrProtection;
    }

    // Filtrování podle módu
    var filteredQuery = query;

    switch (modeEnum)
    {
      case InZooFilterEnum.CrProtection:
        // ČR ochrana
        filteredQuery = query
            .Where(x => 
                !string.IsNullOrEmpty(x.Species!.ProtectionTypeCode) &&
                (x.Species!.ProtectionTypeCode == "KOH" || 
                 x.Species!.ProtectionTypeCode == "SOH" || 
                 x.Species!.ProtectionTypeCode == "OH"));
        break;

      case InZooFilterEnum.Eufauna:
        // EU fauna vše
        filteredQuery = query
            .Where(x => x.Species!.IsEuFauna);
        break;

      case InZooFilterEnum.EuFaunaReduced:
        // EU fauna red. (EU fauna bez CR ochrany)
        filteredQuery = query
            .Where(x => 
                x.Species!.IsEuFauna && 
                (string.IsNullOrEmpty(x.Species.ProtectionTypeCode)));
        break;

      default:
        // Defaultní chování - použijeme CR ochranu
        filteredQuery = query
            .Where(x => 
                !string.IsNullOrEmpty(x.Species!.ProtectionTypeCode) &&
                (x.Species!.ProtectionTypeCode == "KOH" || 
                 x.Species!.ProtectionTypeCode == "SOH" || 
                 x.Species!.ProtectionTypeCode == "OH"));
        break;
    }

    // Aplikace filtru na datum
    var movements = await filteredQuery.ToListAsync();
    var filteredMovements = movements
        .Where(x =>
            string.Compare(x.Movement!.Date!, request.MinDate, StringComparison.Ordinal) >= 0 &&
            string.Compare(x.Movement!.Date!, request.MaxDate, StringComparison.Ordinal) <= 0)
        .ToList();

    if (!filteredMovements.Any())
    {
      return TypedResults.NotFound();
    }

    // Převod na výsledný model - rovnou do plochého pole bez obalení do CREvidenceDto
    var movementsDto = filteredMovements
        .OrderBy(x => x.Movement!.Date)
        .ThenBy(x => x.Species!.NameLat)
        .ThenBy(x => x.Specimen!.AccessionNumber)
        .Select(x => new SpecimenMovementDto
        {
            Date = x.Movement!.Date,
            NameCz = x.Species!.NameCz,
            NameLat = x.Species!.NameLat,
            Gender = x.GenderType?.Code,
            AccessionNumber = x.Specimen!.AccessionNumber,
            Chip = x.Specimen!.Chip,
            RingNumber = x.Specimen!.RingNumber,
            CzechRegistrationNumber = x.Specimen!.CzechRegistrationNumber,
            MovementType = x.IncrementReason != null ? x.IncrementReason.DisplayName : x.DecrementReason?.DisplayName,
            Direction = x.IncrementReason != null ? "+" : "-",
            PartnerName = x.Partner?.Name,
            Note = x.Movement!.Note,
            // Invert příznak pro bezobratlé není v datech, nechávám prázdné
            Invert = ""
        })
        .ToList();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpecimenMovementDto[]>.FromItemAndFluentValidation(
            movementsDto.ToArray(),
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
