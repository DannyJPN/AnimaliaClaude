using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.Globalization;

namespace PziApi.PrintExports.Endpoints;

public class SeizedSpecimensAll
{
  public record Request(string Date, bool IsVertebrate);

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? Protection { get; set; }
    public List<SpecimenDto>? Specimens { get; set; }
  }

  public class SpecimenDto
  {
    public int Id { get; set; }
    public int SpeciesId { get; set; }
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? StudBookName { get; set; }
    public string? Notch { get; set; }
    public string? Chip { get; set; }
    public string? RingNumber { get; set; }
    public string? BirthDate { get; set; }
    public string? InDate { get; set; }
    public string? InLocationName { get; set; }
    public string? OutDate { get; set; }
    public string? OutReasonCode { get; set; }
    public string? OutLocationName { get; set; }
    public string? PlacementName { get; set; }
  }

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.Date)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("Date is not valid date (yyyy/MM/dd).");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesDto[]>>, NotFound, ValidationProblem>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    var allSeizedSpecimensDict = await dbContext.Specimens
        .Where(sp => sp.TaxonomyHierarchyView!.IsVertebrate == request.IsVertebrate)
        .Where(sp => sp.InReasonCode == "IN09") // zabaveno
        .Where(sp => !string.IsNullOrEmpty(sp.InDate) && string.Compare(sp.InDate, request.Date) <= 0)
        .Select(sp => new SpecimenDto()
        {
          Id = sp.Id,
          SpeciesId = sp.SpeciesId,
          AccessionNumber = sp.AccessionNumber,
          GenderTypeCode = sp.GenderTypeCode,
          StudBookName = sp.StudBookName,
          Notch = string.IsNullOrEmpty(sp.Notch) ? "" : sp.Notch.Trim(),
          Chip = string.IsNullOrEmpty(sp.Chip) ? "" : sp.Chip.Trim(),
          RingNumber = string.IsNullOrEmpty(sp.RingNumber) ? "" : sp.RingNumber.Trim(),
          BirthDate = sp.BirthDate,
          InDate = sp.InDate,
          InLocationName = sp.InLocation != null ? sp.InLocation.Keyword : null,
          OutDate = sp.OutDate,
          OutReasonCode = sp.OutReason != null ? sp.OutReason.DisplayName : null,
          OutLocationName = sp.OutLocation != null ? sp.OutLocation.Keyword : null,
          PlacementName = sp.QuantityInZoo > 0 ? sp.OrgHierarchyView!.DepartmentName + " - " + sp.OrgHierarchyView.WorkplaceName + " - " + sp.OrgHierarchyView.DistrictName : ""
        })
        .GroupBy(sp => sp.SpeciesId)
        .ToDictionaryAsync(c => c.Key, c => c.OrderBy(sp => sp.AccessionNumber).ToList());

    var relevantSpeciesIds = allSeizedSpecimensDict.Keys.ToList();
    var speciesQuery = await dbContext.Species
      .Where(s => relevantSpeciesIds.Contains(s.Id))
      .Select(s => new
      {
        Id = s.Id,
        NameCz = s.NameCz,
        NameLat = s.NameLat,
        ClassCode = s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.Code,
        OrderCode = s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.Code,
        FamilyCode = s.TaxonomyGenus!.TaxonomyFamily!.Code,
        Cite = s.CiteTypeCode,
        Eu = s.EuCode,
        Rdb = s.RdbCode,
        ProtectionType = s.ProtectionTypeCode,
        s.IsEep,
        s.IsEsb,
        s.IsIsb
      })
      .ToListAsync();

    var speciesList = speciesQuery
      .Select(s => new
      {
        s.Id,
        s.NameCz,
        s.NameLat,
        s.ClassCode,
        s.OrderCode,
        s.FamilyCode,
        Protection = string.Join(", ", new[]
          {
              s.Cite != null ? $"CITES {s.Cite}" : null,
              s.Eu != null ? $"EU {s.Eu}" : null,
              s.Rdb != null ? $"RDB {s.Rdb}" : null,
              s.ProtectionType,
              s.IsEep ? "EEP" : null,
              s.IsEsb ? "ESB" : null,
              s.IsIsb ? "ISB" : null
          }.Where(x => x != null))
      })
      .OrderBy(s => s.ClassCode)
      .ThenBy(s => s.OrderCode)
      .ThenBy(s => s.FamilyCode)
      .ThenBy(s => s.NameLat)
      .ThenBy(s => s.NameCz, StringComparer.Create(
          CultureInfo.CreateSpecificCulture("cs-CZ"),
          CompareOptions.StringSort))
      .ToList();

    var speciesResult = new List<SpeciesDto>();
    foreach (var species in speciesList)
    {
      speciesResult.Add(new SpeciesDto()
      {
        Id = species.Id,
        NameCz = species.NameCz,
        NameLat = species.NameLat,
        Protection = species.Protection,
        Specimens = allSeizedSpecimensDict.TryGetValue(species.Id, out var specimens) ? specimens : null
      });
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpeciesDto[]>.FromItemAndFluentValidation(
            speciesResult.ToArray(),
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
