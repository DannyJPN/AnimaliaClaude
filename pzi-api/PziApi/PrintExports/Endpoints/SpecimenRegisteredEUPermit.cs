using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpecimenRegisteredEUPermit
{
  public record Request(int? SpecimenId, string? FormType, string? Origin);

  public class SpecimenDto
  {
    public int Id { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? Zims { get; set; }
    public string? Chip { get; set; }
    public string? Notch { get; set; }
    public string? RingNumber { get; set; }
    public string? OtherMarking { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? EuPermit { get; set; }
    public string? BirthDate { get; set; }
    public string? BirthPlace { get; set; }

    // Species info
    public int SpeciesId { get; set; }
    public string? SpeciesNameCz { get; set; }
    public string? SpeciesNameLat { get; set; }
    public string? CiteType { get; set; }
    public string? EuCode { get; set; }

    // Father info
    public int? FatherId { get; set; }
    public string? FatherRegistrationNumber { get; set; }
    public string? FatherEuPermit { get; set; }

    // Mother info
    public int? MotherId { get; set; }
    public string? MotherRegistrationNumber { get; set; }
    public string? MotherEuPermit { get; set; }

    // Movement info
    public string? CitesImport { get; set; }
    public string? CitesExport { get; set; }
    public string? AcquisitionDate { get; set; }
    public string? IncrementReason { get; set; }
    public string? PartnerCountry { get; set; }
    public string? Origin { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpecimenDto>>, NotFound, BadRequest<string>>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    if (request.SpecimenId == null)
      return TypedResults.BadRequest("SpecimenId is required");

    var specimenId = request.SpecimenId.Value;

    // Get specimen with species info
    var specimen = await dbContext.Specimens
        .Include(s => s.Species)
        .FirstOrDefaultAsync(s => s.Id == specimenId);

    if (specimen == null)
      return TypedResults.NotFound();

    // Get parents info in a single query
    var parentIds = new List<int>();
    if (specimen.FatherId.HasValue) parentIds.Add(specimen.FatherId.Value);
    if (specimen.MotherId.HasValue) parentIds.Add(specimen.MotherId.Value);

    var parents = new Dictionary<int, (string? RegistrationNumber, string? EuPermit)>();
    if (parentIds.Any())
    {
      var parentData = await dbContext.Specimens
          .Where(s => parentIds.Contains(s.Id))
          .Select(s => new { s.Id, s.RegistrationNumber, s.EuPermit })
          .ToListAsync();

      foreach (var parent in parentData)
      {
        parents[parent.Id] = (parent.RegistrationNumber, parent.EuPermit);
      }
    }

    // Find the most recent incoming movement
    var incomingMovement = await dbContext.Movements
        .Include(m => m.IncrementReason)
        .Include(m => m.Partner)
        .Where(m => m.SpecimenId == specimenId && m.Quantity > 0 && m.IncrementReasonCode != null && m.IncrementReasonCode != "IN01")
        .OrderByDescending(m => m.Date)
        .FirstOrDefaultAsync();

    // Create flat specimen DTO with all properties
    var specimenDto = new SpecimenDto
    {
      Id = specimen.Id,
      GenderTypeCode = specimen.GenderTypeCode,
      Zims = specimen.Zims,
      Notch = string.IsNullOrEmpty(specimen.Notch) ? "" : specimen.Notch.Trim(),
      Chip = string.IsNullOrEmpty(specimen.Chip) ? "" : specimen.Chip.Trim(),
      RingNumber = string.IsNullOrEmpty(specimen.RingNumber) ? "" : specimen.RingNumber.Trim(),
      OtherMarking = specimen.OtherMarking,
      RegistrationNumber = specimen.RegistrationNumber,
      EuPermit = specimen.EuPermit,
      BirthDate = specimen.BirthDate,
      BirthPlace = specimen.BirthPlace,

      // Species info
      SpeciesId = specimen.Species?.Id ?? 0,
      SpeciesNameCz = specimen.Species?.NameCz,
      SpeciesNameLat = specimen.Species?.NameLat,
      CiteType = specimen.Species?.CiteTypeCode,
      EuCode = specimen.Species?.EuCode,

      // Parent info
      FatherId = specimen.FatherId,
      MotherId = specimen.MotherId
    };

    // Add father info if available
    if (specimen.FatherId.HasValue && parents.TryGetValue(specimen.FatherId.Value, out var fatherInfo))
    {
      specimenDto.FatherRegistrationNumber = fatherInfo.RegistrationNumber;
      specimenDto.FatherEuPermit = fatherInfo.EuPermit;
    }

    // Add mother info if available
    if (specimen.MotherId.HasValue && parents.TryGetValue(specimen.MotherId.Value, out var motherInfo))
    {
      specimenDto.MotherRegistrationNumber = motherInfo.RegistrationNumber;
      specimenDto.MotherEuPermit = motherInfo.EuPermit;
    }

    // Add movement info if available
    // IN01 = naroyeni
    if (incomingMovement != null && specimen.InReasonCode != "IN01")
    {
     
      specimenDto.CitesImport = incomingMovement.CitesImport;
      specimenDto.CitesExport = incomingMovement.CitesExport; 
      specimenDto.AcquisitionDate = incomingMovement.Date;
      specimenDto.IncrementReason = incomingMovement.IncrementReason?.DisplayName;
      specimenDto.PartnerCountry = incomingMovement.Partner?.Country;
    }

    // Set origin directly from request (frontend provides the code)
    specimenDto.Origin = request.Origin;

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpecimenDto>.FromItemAndFluentValidation(
            specimenDto,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
