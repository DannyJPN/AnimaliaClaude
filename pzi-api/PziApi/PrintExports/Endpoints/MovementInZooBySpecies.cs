using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using FluentValidation.Results;

namespace PziApi.PrintExports.Endpoints;

// Sestavy / Zoologie - Pohyb v zoo podle druhu (P3)
// The output is grouped by species
public static class MovementInZooBySpecies
{
    private static string? FindClosestDepartmentParent(Models.OrganizationLevel? orgLevel)
    {
        var current = orgLevel?.Parent;
        while (current != null)
        {
            if (current.Level == "department")
            {
                return current.Name;
            }
            current = current.Parent;
        }
        return null;
    }

    public record Request(string MinDate, string MaxDate);

    public class SpeciesDto
    {
        public int Id { get; set; }
        public string NameCz { get; set; } = string.Empty;
        public string NameLat { get; set; } = string.Empty;
        public List<MovementDto> Movements { get; set; } = new();
    }

    public class MovementDto
    {
        public int Id { get; set; }
        public string Date { get; set; } = string.Empty;
        public string? Note { get; set; }
        public int? AccessionNumber { get; set; }
        public string? Gender { get; set; }
        public string CurrentRegion { get; set; } = string.Empty;
        public string? PreviousRegion { get; set; }
    }

    public static async Task<Results<Ok<CommonDtos.SuccessResult<List<SpeciesDto>>>, BadRequest<string>>> Handle(
        Request request,
        PziDbContext dbContext)
    {
        if (string.IsNullOrEmpty(request.MinDate) || string.IsNullOrEmpty(request.MaxDate))
        {
            return TypedResults.BadRequest("Both MinDate and MaxDate must be provided");
        }

        // 1. Get filtered placements in date range with organization levels
        var minYear = request.MinDate[..4];
        var maxYear = request.MaxDate[..4];
        
        var filteredPlacements = await dbContext.SpecimenPlacements
            .Include(p => p.OrganizationLevel!)
                .ThenInclude(ol => ol!.Parent)
            .Where(p => p.ValidSince != null && p.ValidSince.Length >= 4 &&
                       string.Compare(p.ValidSince.Substring(0, 4), minYear) >= 0 &&
                       string.Compare(p.ValidSince.Substring(0, 4), maxYear) <= 0 &&
                       p.OrganizationLevelId != null)
            .ToListAsync();

        // Apply exact date filtering in memory using DateTimeHelpers
        filteredPlacements = filteredPlacements
            .Where(p => DateTimeHelpers.CompareDates(p.ValidSince, request.MinDate) >= 0 &&
                       DateTimeHelpers.CompareDates(p.ValidSince, request.MaxDate) <= 0)
            .ToList();

        if (!filteredPlacements.Any())
        {
            return TypedResults.Ok(CommonDtos.SuccessResult<List<SpeciesDto>>.FromItemAndFluentValidation(
                new List<SpeciesDto>(),
                new ValidationResult()
            ));
        }

        // 2. Get specimen information
        var specimenIds = filteredPlacements.Select(p => p.SpecimenId).Distinct().ToList();

        // Load specimens with their species
        var specimens = await dbContext.Specimens
            .Where(s => specimenIds.Contains(s.Id))
            .Include(s => s.Species)
            .ToDictionaryAsync(s => s.Id, s => s);

        // 3. Build movement DTOs without previous/next regions
        var movementDtos = new List<MovementDto>();
        var speciesDict = new Dictionary<int, SpeciesDto>();
        
        foreach (var placement in filteredPlacements)
        {
            if (!specimens.TryGetValue(placement.SpecimenId, out var specimen) || 
                placement.OrganizationLevel == null)
                continue;

            string? currentRegionName = null;
            string? currentSectionName = null;
            
            if (placement.OrganizationLevel.Level == "department")
            {
                currentSectionName = placement.OrganizationLevel.Name;
            }
            else if (placement.OrganizationLevel.Level == "district")
            {
                currentRegionName = placement.OrganizationLevel.Name;
                currentSectionName = FindClosestDepartmentParent(placement.OrganizationLevel);
            }

            // Create movement DTO (without previous region info)
            var movementDto = new MovementDto
            {
                Id = placement.Id,
                Date = placement.ValidSince ?? "",
                Note = placement.Note,
                AccessionNumber = specimen.AccessionNumber,
                Gender = specimen.GenderTypeCode,
                CurrentRegion = $"{currentRegionName}/{currentSectionName}"
                // Previous region will be filled later
            };

            movementDtos.Add(movementDto);

            // Create or update species entry
            if (specimen.Species != null)
            {
                if (!speciesDict.TryGetValue(specimen.SpeciesId, out var speciesDto))
                {
                    speciesDto = new SpeciesDto
                    {
                        Id = specimen.SpeciesId,
                        NameCz = specimen.Species.NameCz ?? string.Empty,
                        NameLat = specimen.Species.NameLat ?? string.Empty,
                        Movements = new List<MovementDto>()
                    };
                    speciesDict.Add(specimen.SpeciesId, speciesDto);
                }
            }
        }

        // 4. Load complete history for specimens
        // Get all specimen placements (not just filtered by date) for the specimens
        var allSpecimenPlacements = await dbContext.SpecimenPlacements
            .Where(p => specimenIds.Contains(p.SpecimenId))
            .Include(p => p.OrganizationLevel!)
                .ThenInclude(ol => ol!.Parent)
            .OrderBy(p => p.SpecimenId)
            .ThenBy(p => p.ValidSince) // Chronological order
            .ToListAsync();

        // Group all placements by specimen ID
        var placementHistoryBySpecimen = allSpecimenPlacements
            .GroupBy(p => p.SpecimenId)
            .ToDictionary(g => g.Key, g => g.ToList());

        // 5. Add previous region information
        // Create a lookup table of movement DTOs by their ID
        var movementDtoById = movementDtos.ToDictionary(m => m.Id);

        // For each specimen, go through its placement history
        foreach (var specimenId in placementHistoryBySpecimen.Keys)
        {
            var placements = placementHistoryBySpecimen[specimenId];
            
            // Process each placement in chronological order
            for (int i = 0; i < placements.Count; i++)
            {
                var placement = placements[i];
                
                // If this placement is in our filtered set
                if (movementDtoById.TryGetValue(placement.Id, out var movementDto))
                {
                    // Previous region
                    if (i > 0)
                    {
                        var prevPlacement = placements[i - 1];
                        if (prevPlacement.OrganizationLevel != null)
                        {
                            string rajon = "";
                            string usek = "";
                            if (prevPlacement.OrganizationLevel.Level == "district") {
                                rajon = prevPlacement.OrganizationLevel.Name;
                                usek = FindClosestDepartmentParent(prevPlacement.OrganizationLevel) ?? "";
                            } else if (prevPlacement.OrganizationLevel.Level == "department") {
                                usek = prevPlacement.OrganizationLevel.Name;
                            } else {
                                rajon = prevPlacement.OrganizationLevel.Name;
                            }
                            movementDto.PreviousRegion = $"{prevPlacement.ValidSince}:{rajon}/{usek}";
                        }
                    }
                }
            }
        }

        // 6. Group by species and sort
        // Sort movements
        movementDtos = movementDtos
            .OrderBy(m => DateTimeHelpers.StandardizeDate(m.Date))
            .ThenBy(m => m.AccessionNumber)
            .ToList();

        // Group movements by species and add to species DTO
        foreach (var movement in movementDtos)
        {
            // Find the species this movement belongs to
            var specimen = specimens[filteredPlacements.First(p => p.Id == movement.Id).SpecimenId];
            if (speciesDict.TryGetValue(specimen.SpeciesId, out var species))
            {
                species.Movements.Add(movement);
            }
        }

        // Sort species by name
        var results = speciesDict.Values
            .OrderBy(s => s.NameLat)
            .ToList();

        return TypedResults.Ok(
            CommonDtos.SuccessResult<List<SpeciesDto>>.FromItemAndFluentValidation(
                results,
                new ValidationResult()
            ));
    }
}
