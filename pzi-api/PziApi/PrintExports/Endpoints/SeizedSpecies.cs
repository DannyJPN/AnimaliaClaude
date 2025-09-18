// Sestavy / Ekonomika - Zabavene druhy ke dni -> P3
// Sestavy / Ekonomika - Zabavene druhy ke dni (b) -> P3

using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SeizedSpecies
{
  public record Request(string Date, bool? IsVertebrate);

  public class TaxonomyClassDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public IList<SpeciesDto> Species { get; set; } = [];
  }

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? Cites { get; set; }
    public string? RdbCode { get; set; }
    public string? EuCode { get; set; }
    public string? ProtectionType { get; set; }
    public bool IsEep { get; set; }
    public bool IsEsb { get; set; }
    public bool IsIsb { get; set; }
    public int MaleCount { get; set; }
    public int FemaleCount { get; set; }
    public int UnknownGenderCount { get; set; }
    public int TaxonomyClassId { get; set; }

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

  public static async Task<Results<Ok<CommonDtos.SuccessResult<TaxonomyClassDto[]>>, NotFound, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
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

    var taxonomyPhylaIds = await dbContext.TaxonomyPhyla.Where(tp => tp.IsVertebrate == request.IsVertebrate).Select(tp => tp.Id).ToListAsync();

    // IN09 -> zabaveno
    var classesWithSeizedSpecimensDict = await dbContext.Specimens
        .Where(sp => sp.TaxonomyHierarchyView!.IsVertebrate == request.IsVertebrate)
        .Where(sp => sp.InReasonCode == "IN09")
        .Where(sp => !string.IsNullOrEmpty(sp.InDate) && string.Compare(sp.InDate, request.Date) <= 0)
        .Where(sp => string.IsNullOrEmpty(sp.OutDate) || string.Compare(sp.OutDate, request.Date) > 0)
        .Select(sp => new
        {
          Id = sp.Id,
          SpeciesId = sp.SpeciesId,
          GenderTypeCode = sp.GenderTypeCode,
          ClassId = sp.TaxonomyHierarchyView!.ClassId,
        })
        .GroupBy(sp => sp.ClassId)
        .ToDictionaryAsync(c => c.Key, c => c.GroupBy(g => g.SpeciesId).ToDictionary(s => s.Key, s => s.ToList()));

    var relevantSpeciesIds = classesWithSeizedSpecimensDict.Values.SelectMany(c => c.Select(sp => sp.Key)).ToList();
    var relevantSpecies = await dbContext.Species
        .Where(sp => relevantSpeciesIds.Contains(sp.Id))
        .Select(sp => new SpeciesDto
        {
          Id = sp.Id,
          NameCz = sp.NameCz,
          NameLat = sp.NameLat,
          Cites = sp.CiteTypeCode,
          RdbCode = sp.RdbCode,
          EuCode = sp.EuCode,
          ProtectionType = sp.ProtectionTypeCode,
          IsEep = sp.IsEep,
          IsEsb = sp.IsEsb,
          IsIsb = sp.IsIsb
        })
        .ToDictionaryAsync(s => s.Id);

    var classes = await dbContext.TaxonomyClasses
        .Where(sp => classesWithSeizedSpecimensDict.Keys.Contains(sp.Id))
        .Select(tc => new TaxonomyClassDto
        {
          Id = tc.Id,
          NameCz = tc.NameCz,
          NameLat = tc.NameLat
        })
        .OrderBy(sp => sp.NameLat)
        .ThenBy(sp => sp.NameCz)
        .ToArrayAsync();

    foreach (var taxonomyClass in classes)
    {
      var classSpecies = new List<SpeciesDto>();
      if (classesWithSeizedSpecimensDict.TryGetValue(taxonomyClass.Id, out var speciesByClassId))
      {
        foreach (var speciesId in speciesByClassId.Keys)
        {
          if (relevantSpecies.TryGetValue(speciesId, out var species)
            && speciesByClassId.TryGetValue(speciesId, out var speciesInClass))
          {
            species.MaleCount = speciesInClass.Where(sp => sp.GenderTypeCode == "M").Count();
            species.FemaleCount = speciesInClass.Where(sp => sp.GenderTypeCode == "F").Count();
            species.UnknownGenderCount = speciesInClass.Where(sp => sp.GenderTypeCode == "U").Count();

            classSpecies.Add(species);
          }
        }
      }

      if (classSpecies.Count > 0)
        taxonomyClass.Species = classSpecies.OrderBy(sp => sp.NameLat).ThenBy(sp => sp.NameCz).ToArray();
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<TaxonomyClassDto[]>.FromItemAndFluentValidation(
            classes,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
