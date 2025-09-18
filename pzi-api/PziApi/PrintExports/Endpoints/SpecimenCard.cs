using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpecimenCard
{
  public record Request(
    int? SpecimenId,
    int? SpeciesId,
    string? NameCz,
    string? NameLat,
    int? AccessionNumberFrom,
    int? AccessionNumberTo);

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

  public class MovementDto
  {

    public int Id { get; set; }
    public int SpecimenId { get; set; }
    public string Date { get; set; } = null!;
    public int Quantity { get; set; }
    public string? IncrementReason { get; set; }
    public string? DecrementReason { get; set; }
    public string? Locality { get; set; }
    public string? Note { get; set; }
  }

  public class SpecimenDto
  {
    public SpeciesDto? Species { get; set; }
    public int Id { get; set; }
    public string? Name { get; set; }
    public string? Zims { get; set; }
    public string? GenderTypeCode { get; set; }
    public int? AccessionNumber { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? EuPermit { get; set; }
    public string? StudBookNumber { get; set; }
    public string? StudBookName { get; set; }
    public string? Chip { get; set; }
    public string? Notch { get; set; }
    public string? RingNumber { get; set; }
    public string? OtherMarking { get; set; }
    public string? BirthDate { get; set; }
    public string? BirthPlace { get; set; }
    public string? BirthMethod { get; set; }
    public string? Rearing { get; set; }
    public ParentDto? Mother { get; set; }
    public ParentDto? Father { get; set; }
    public MovementDto[] Movements { get; set; } = null!;
    public string? Note { get; set; }
    public int QuantityInZoo { get; set; }
    public BioEntryDto[] BioEntries { get; set; } = null!;
  }

  public class BioEntryDto // This functionality is uncertain; original data is always empty.
  {
    public string? Date { get; set; }
    public string? Action { get; set; }
    public string? Note { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpecimenDto[]>>, NotFound>> Handle([FromBody] Request request, PziDbContext dbContext)
  {
    var specimenId = request.SpecimenId;
    var speciesId = request.SpeciesId;
    var nameCz = request.NameCz;
    var nameLat = request.NameLat;
    var accessionNumberFrom = request.AccessionNumberFrom;
    var accessionNumberTo = request.AccessionNumberTo;

    var specimenResults = await dbContext.Specimens
        .Include(s => s.Species)
        .Include(s => s.Father)
        .Include(s => s.Mother)
        .Where(sp =>
        (specimenId.HasValue && sp.Id == specimenId)
        ||
        (speciesId.HasValue && sp.SpeciesId == speciesId && sp.AccessionNumber >= accessionNumberFrom && sp.AccessionNumber <= accessionNumberTo)
        ||
        ( // NOTE: species are selected by autocomplete so the part below is probably not needed we will not search by nameCz or nameLat
            (
                (sp.Species != null && !string.IsNullOrWhiteSpace(nameCz) && EF.Functions.Like(sp.Species.NameCz, $"%{nameCz}%"))
                ||
                (sp.Species != null && !string.IsNullOrWhiteSpace(nameLat) && EF.Functions.Like(sp.Species.NameLat, $"%{nameLat}%"))
            )
            && sp.AccessionNumber >= accessionNumberFrom && sp.AccessionNumber <= accessionNumberTo
        )
    ).OrderBy(s => s.Species!.NameLat)
    .ThenBy(s => s.Species!.NameCz)
    .ThenBy(s => s.AccessionNumber)
    .ToListAsync();

    if (specimenResults == null || specimenResults.Count == 0)
    {
      return TypedResults.Ok(
        CommonDtos.SuccessResult<SpecimenDto[]>.FromItemAndFluentValidation(
            Array.Empty<SpecimenDto>(),
            new FluentValidation.Results.ValidationResult()
        ));
    }

    var specimenIds = specimenResults.Select(sp => sp.Id).ToList();

    var movementsDictionary = await dbContext.Movements
      .Include(m => m.IncrementReason)
      .Include(m => m.DecrementReason)
      .Include(m => m.Partner)
      .Where(m => specimenIds.Contains(m.SpecimenId))
      .Select(m => new MovementDto
      {
        Id = m.Id,
        SpecimenId = m.SpecimenId,
        Date = m.Date,
        Quantity = m.Quantity,
        IncrementReason = m.IncrementReason!.DisplayName,
        DecrementReason = m.DecrementReason!.DisplayName,
        Locality = m.Partner!.Keyword,
        Note = m.Note
      })
      .GroupBy(m => m.SpecimenId)
      .ToDictionaryAsync(m => m.Key, m => m.OrderBy(m => m.Date).ToArray());

    var specimenDtos = new List<SpecimenDto>();

    foreach (var specimen in specimenResults)
    {
      var specimenMovements = movementsDictionary.ContainsKey(specimen.Id) ? movementsDictionary[specimen.Id] : Array.Empty<MovementDto>();
      foreach (var movement in specimenMovements)
      {
        var quocient = !string.IsNullOrEmpty(movement.DecrementReason) ? -1 : 1;
        movement.Quantity *= quocient;
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
        Name = specimen.Name,
        Zims = specimen.Zims,
        RegistrationNumber = specimen.RegistrationNumber,
        EuPermit = specimen.EuPermit,
        StudBookNumber = specimen.StudBookNumber,
        StudBookName = specimen.StudBookName,
        Chip = string.IsNullOrEmpty(specimen.Chip) ? "" : specimen.Chip.Trim(),
        RingNumber = string.IsNullOrEmpty(specimen.RingNumber) ? "" : specimen.RingNumber.Trim(),
        Notch = string.IsNullOrEmpty(specimen.Notch) ? "" : specimen.Notch.Trim(),
        OtherMarking = specimen.OtherMarking,
        BirthDate = specimen.BirthDate,
        BirthPlace = specimen.BirthPlace,
        BirthMethod = specimen.BirthMethod,
        Rearing = specimen.Rearing,
        AccessionNumber = specimen.AccessionNumber,
        GenderTypeCode = specimen.GenderTypeCode,
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
        Movements = specimenMovements,
        Note = specimen.Note,
        QuantityInZoo = specimen.QuantityInZoo,
        BioEntries = new [] { new BioEntryDto() } // This functionality is uncertain; original data is always empty.
      };

      specimenDtos.Add(dto);
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpecimenDto[]>.FromItemAndFluentValidation(
            specimenDtos.ToArray(),
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
