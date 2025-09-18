using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public record MovementInZooByDateRequest(string MinDate, string MaxDate);



public class SpecimenDto
{
  public int Id { get; set; }
  public int? AccessionNumber { get; set; }
  public string? Gender { get; set; }
  public string? SpeciesNameLat { get; set; }
  public string? SpeciesNameCz { get; set; }
}

public class MovementInZooByDateMovementDto
{
  public int Id { get; set; }
  public string Date { get; set; } = string.Empty;
  public string? Note { get; set; }

  public SpecimenDto Specimen { get; set; } = new();
  public string? CurrentRegion { get; set; }
  public string? PreviousRegion { get; set; }
}

public static class MovementInZooByDate
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<List<MovementInZooByDateMovementDto>>>, BadRequest<string>>> Handle(
      MovementInZooByDateRequest request,
      PziDbContext dbContext)
  {
    if (string.IsNullOrEmpty(request.MinDate) || string.IsNullOrEmpty(request.MaxDate))
    {
      return TypedResults.BadRequest("Both MinDate and MaxDate must be provided");
    }

    var placementsInRange = await dbContext.SpecimenPlacements
          .Include(sp => sp.OrganizationLevel)
            .ThenInclude(ol => ol!.Parent)
          .Include(sp => sp.Location)
            .ThenInclude(l => l!.OrganizationLevel)
              .ThenInclude(ol => ol!.Parent)
          .Include(sp => sp.Specimen)
            .ThenInclude(s => s!.Species)
          .Where(sp => string.Compare(sp.ValidSince, request.MinDate) >= 0 && string.Compare(sp.ValidSince, request.MaxDate) <= 0)
          .ToArrayAsync();

    var specimenIds = placementsInRange
                          .Select(sp => sp.SpecimenId)
                          .Distinct();

    var initialPlacements = await dbContext.Specimens
          .Where(s => specimenIds.Contains(s.Id))
          .Select(s => new
          {
            s.Id,
            Placement = dbContext.SpecimenPlacements
                .Include(sp => sp.OrganizationLevel)
                  .ThenInclude(ol => ol!.Parent)
                .Include(sp => sp.Location)
                  .ThenInclude(l => l!.OrganizationLevel)
                    .ThenInclude(ol => ol!.Parent)
                .Where(sp => sp.SpecimenId == s.Id)
                .Where(sp => string.Compare(sp.ValidSince, request.MinDate) < 0)
                .OrderByDescending(sp => sp.ValidSince)
                .FirstOrDefault()
          })
          .ToArrayAsync();

    var currentPlacementsBySpecimenIds = initialPlacements.ToDictionary(
      ip => ip.Id,
      ip => ip.Placement
    );

    var placementsByDay = placementsInRange
          .GroupBy(sp => sp.ValidSince)
          .OrderBy(g => g.Key)
          .Select(g => new { Date = g.Key, Items = g.ToArray() })
          .ToArray();

    var results = new List<MovementInZooByDateMovementDto>();

    foreach (var dayPlacements in placementsByDay)
    {
      var orderedItems = dayPlacements.Items
        .OrderBy(sp => RegionSectionHelper.FormatDateRegionSection(dayPlacements.Date, sp.Location?.OrganizationLevel ?? sp.OrganizationLevel))
        .ThenBy(sp => sp.Specimen!.Species!.NameCz)
        .ThenBy(sp => sp.Specimen!.Species!.NameLat)
        .ThenBy(sp => sp.Specimen!.AccessionNumber)
        .ToArray();

      foreach (var sp in orderedItems)
      {
        currentPlacementsBySpecimenIds.TryGetValue(sp.SpecimenId, out var previousPlacement);

        var previousOrgLevel = previousPlacement?.Location?.OrganizationLevel ?? previousPlacement?.OrganizationLevel;
        var currentOrgLevel = sp.Location?.OrganizationLevel ?? sp.OrganizationLevel;

        string? previousRegionFormatted = null;
        string? currentRegion = null;

        if (previousOrgLevel != null && previousPlacement != null)
        {
          previousRegionFormatted = RegionSectionHelper.FormatDateRegionSection(previousPlacement.ValidSince, previousOrgLevel);
        }

        if (currentOrgLevel != null)
        {
          currentRegion = currentOrgLevel.Name;
        }

        results.Add(new MovementInZooByDateMovementDto
        {
          Date = dayPlacements.Date,
          Id = sp.Id,
          Note = sp.Note,
          Specimen = new SpecimenDto
          {
            Id = sp.Specimen!.Id,
            AccessionNumber = sp.Specimen.AccessionNumber,
            Gender = sp.Specimen.GenderTypeCode,
            SpeciesNameLat = sp.Specimen.Species!.NameLat,
            SpeciesNameCz = sp.Specimen.Species.NameCz
          },
          PreviousRegion = previousRegionFormatted,
          CurrentRegion = currentRegion
        });

        currentPlacementsBySpecimenIds[sp.SpecimenId] = sp;
      }
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<List<MovementInZooByDateMovementDto>>.FromItemAndFluentValidation(
            results,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
