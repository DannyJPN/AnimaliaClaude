using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using FluentValidation.Results;

namespace PziApi.PrintExports.Endpoints;

    public static class MovementInZooByRegion
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

    public class OrgLevelDto
    {
        public string? Region { get; set; }
        public string? Section { get; set; }
        public List<MovementDto> Movements { get; set; } = new();
    }

    public class MovementDto
    {
        public int Id { get; set; }
        public string Date { get; set; } = string.Empty;
        public string? Note { get; set; }
        public int? AccessionNumber { get; set; }
        public string? Gender { get; set; }
        public string? SpeciesNameLat { get; set; }
        public string? SpeciesNameCz { get; set; }
        public string? Region { get; set; }
        public string? Section { get; set; }
        public string? RegionPrev { get; set; }
        public string? RegionNext { get; set; }
    }

    public static async Task<Results<Ok<CommonDtos.SuccessResult<List<OrgLevelDto>>>, BadRequest<string>>> Handle(
        Request request,
        PziDbContext dbContext)
    {
        if (string.IsNullOrEmpty(request.MinDate) || string.IsNullOrEmpty(request.MaxDate))
        {
            return TypedResults.BadRequest("Both MinDate and MaxDate must be provided");
        }

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

        filteredPlacements = filteredPlacements
            .Where(p => DateTimeHelpers.CompareDates(p.ValidSince, request.MinDate) >= 0 &&
                       DateTimeHelpers.CompareDates(p.ValidSince, request.MaxDate) <= 0)
            .ToList();

        if (!filteredPlacements.Any())
        {
            return TypedResults.Ok(CommonDtos.SuccessResult<List<OrgLevelDto>>.FromItemAndFluentValidation(
                new List<OrgLevelDto>(),
                new ValidationResult()
            ));
        }

        var specimenIds = filteredPlacements.Select(p => p.SpecimenId).Distinct().ToList();
        var specimens = await dbContext.Specimens
            .Where(s => specimenIds.Contains(s.Id))
            .Include(s => s.Species)
            .ToDictionaryAsync(s => s.Id, s => s);

        var movementDtos = new List<MovementDto>();
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

            movementDtos.Add(new MovementDto
            {
                Id = placement.Id,
                Date = placement.ValidSince ?? "",
                Note = placement.Note,
                AccessionNumber = specimen.AccessionNumber,
                Gender = specimen.GenderTypeCode,
                SpeciesNameLat = specimen.Species?.NameLat,
                SpeciesNameCz = specimen.Species?.NameCz,
                Region = currentRegionName,
                Section = currentSectionName
            });
        }

        var allSpecimenPlacements = await dbContext.SpecimenPlacements
            .Where(p => specimenIds.Contains(p.SpecimenId))
            .Include(p => p.OrganizationLevel!)
                .ThenInclude(ol => ol!.Parent)
            .OrderBy(p => p.SpecimenId)
            .ThenBy(p => p.ValidSince)
            .ToListAsync();

        var placementHistoryBySpecimen = allSpecimenPlacements
            .GroupBy(p => p.SpecimenId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var movementDtoById = movementDtos.ToDictionary(m => m.Id);
        foreach (var specimenId in placementHistoryBySpecimen.Keys)
        {
            var placements = placementHistoryBySpecimen[specimenId];
            for (int i = 0; i < placements.Count; i++)
            {
                var placement = placements[i];
                if (movementDtoById.TryGetValue(placement.Id, out var movementDto))
                {
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
                            movementDto.RegionPrev = $"{prevPlacement.ValidSince}:{rajon}/{usek}";
                        }
                    }
                    
                    if (i < placements.Count - 1)
                    {
                        var nextPlacement = placements[i + 1];
                        if (nextPlacement.OrganizationLevel != null)
                        {
                            string rajon = "";
                            string usek = "";
                            if (nextPlacement.OrganizationLevel.Level == "district") {
                                rajon = nextPlacement.OrganizationLevel.Name;
                                usek = FindClosestDepartmentParent(nextPlacement.OrganizationLevel) ?? "";
                            } else if (nextPlacement.OrganizationLevel.Level == "department") {
                                usek = nextPlacement.OrganizationLevel.Name;
                            } else {
                                rajon = nextPlacement.OrganizationLevel.Name;
                            }
                            movementDto.RegionNext = $"{nextPlacement.ValidSince}:{rajon}/{usek}";
                        }
                    }
                }
            }
        }

        var results = movementDtos
            .GroupBy(m => new { m.Region, m.Section })
            .Select(g => new OrgLevelDto
            {
                Region = g.Key.Region,
                Section = g.Key.Section,
                Movements = g.OrderBy(m => DateTimeHelpers.StandardizeDate(m.Date)).ThenBy(m => m.AccessionNumber).ToList()
            })
            .OrderBy(o => o.Region)
            .ThenBy(o => o.Section)
            .ToList();

        return TypedResults.Ok(
            CommonDtos.SuccessResult<List<OrgLevelDto>>.FromItemAndFluentValidation(
                results,
                new ValidationResult()
            ));
    }
}