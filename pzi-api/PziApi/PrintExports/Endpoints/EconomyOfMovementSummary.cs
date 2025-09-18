using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.Models;
using System.Linq;

namespace PziApi.PrintExports.Endpoints;

public static class EconomyMovementSummary
{
    public record Request(string MinDate, string MaxDate);

    public class MovementDTO
    {
        public string? Species_CZ { get; set; }
        public int? PrirustCislo { get; set; }
        public int Pocet { get; set; }
        public decimal? Cena { get; set; }
        public string? Kryptogram { get; set; }
        public string Datum { get; set; } = string.Empty; 
        public string? Heslo { get; set; }
    }

    public class MovementGroupDTO
    {
        public string PohybZpusob { get; set; } = string.Empty; 
        public int PohybZpusobPocetCelkem { get; set; }
        public decimal PohybZpusobCenaCelkem { get; set; }
        public List<MovementDTO> Movements { get; set; } = new(); 
    }

    public class ClassMovementsDTO
    {
        public string TaxonomyClassName { get; set; } = string.Empty; 
        public string MinDatum { get; set; } = string.Empty;
        public string MaxDatum { get; set; } = string.Empty; 
        public int PohybPocetCelkem { get; set; }
        public decimal PohybCenaCelkem { get; set; }
        public List<MovementGroupDTO> Groups { get; set; } = new();
    }

    
    public class MovementSummaryItemDto
    {
        public string MovementType { get; set; } = string.Empty; 
        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }

    public class MovementSummaryGroupDto
    {
        public List<MovementSummaryItemDto> Items { get; set; } = new(); 
        public int TotalQuantity { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class MovementSummaryDto
    {
        public MovementSummaryGroupDto Increments { get; set; } = new(); 
        public MovementSummaryGroupDto Decrements { get; set; } = new(); 

        public MovementSummaryItemDto Difference => new()
        {
            MovementType = "Rozdíl",
            Quantity = Increments.TotalQuantity - Decrements.TotalQuantity,
            Price = Increments.TotalPrice - Decrements.TotalPrice
        };
    }

    public class EconomyOfMovementSummaryResponse
    {
        public List<ClassMovementsDTO> ClassMovements { get; set; } = new(); 

        public MovementSummaryDto FundamentalHerd { get; set; } = new(); 
    }


    public class RequestValidator : AbstractValidator<Request>
    {
        public RequestValidator()
        {
            RuleFor(x => x.MinDate).NotEmpty().Must(DateTimeHelpers.IsValidFullDateString);
            RuleFor(x => x.MaxDate).NotEmpty().Must(DateTimeHelpers.IsValidFullDateString);
        }
    }

    public static async Task<Results<Ok<CommonDtos.SuccessResult<EconomyOfMovementSummaryResponse>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
        [FromBody] Request request,
        PziDbContext dbContext)
    {
        var validator = new RequestValidator();
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return TypedResults.BadRequest(CommonDtos.ValidationErrors.FromFluentValidation(validationResult));
        }

        var fundamentalHerdClasses = new HashSet<string> { "Aves", "Mammalia", "Reptilia" };

        var minYear = request.MinDate.Substring(0, 4);
        var maxYear = request.MaxDate.Substring(0, 4);

        var taxonomyClasses = await dbContext.TaxonomyClasses.ToDictionaryAsync(tc => tc.Id);

        var movements = (await dbContext.Movements
            .Include(m => m.IncrementReason)
            .Include(m => m.DecrementReason)
            .Include(m => m.Specimen)!
                .ThenInclude(s => s!.TaxonomyHierarchyView)
            .Include(m => m.Partner)
            .Where(m => m.Date.Length >= 4 && string.Compare(m.Date.Substring(0, 4), minYear) >= 0 && string.Compare(m.Date.Substring(0, 4), maxYear) <= 0)
            .Where(m => m.Specimen != null && m.Specimen.TaxonomyHierarchyView != null && fundamentalHerdClasses.Contains(m.Specimen.TaxonomyHierarchyView.ClassNameLat!))
            .ToListAsync())
            .Where(m => DateTimeHelpers.CompareDates(m.Date, request.MinDate) >= 0 && DateTimeHelpers.CompareDates(m.Date, request.MaxDate) <= 0)
            .ToList();

        var classGroups = movements.GroupBy(m => m.Specimen!.TaxonomyHierarchyView!.ClassNameLat);

        var classMovementsResult = new List<ClassMovementsDTO>();

        foreach (var classGroup in classGroups)
        {
            var classMovements = new ClassMovementsDTO
            {
                TaxonomyClassName = classGroup.Key!,
                MinDatum = request.MinDate,
                MaxDatum = request.MaxDate
            };

            var movementTypeGroups = classGroup.GroupBy(m => m.IncrementReasonCode ?? m.DecrementReasonCode).OrderBy(g => g.First().IncrementReason?.DisplayName ?? g.First().DecrementReason?.DisplayName);

            foreach (var group in movementTypeGroups)
            {
                if (group.Key == null) continue;

                var firstMovementInGroup = group.First();
                var displayName = firstMovementInGroup.IncrementReason?.DisplayName ?? firstMovementInGroup.DecrementReason?.DisplayName;

                if (displayName == null) continue;

                var movementGroup = new MovementGroupDTO { PohybZpusob = displayName };

                foreach (var movement in group)
                {
                    decimal calculatedPrice = (movement.Price ?? 0m) * movement.Quantity;
                    if (movement.DecrementReasonCode != null)
                    {
                        calculatedPrice = -calculatedPrice;
                    }
                    
                    movementGroup.Movements.Add(new MovementDTO
                    {
                        Species_CZ = movement.Specimen!.TaxonomyHierarchyView!.SpeciesNameCz,
                        PrirustCislo = movement.Specimen.AccessionNumber,
                        Pocet = movement.Quantity,
                        Cena = calculatedPrice, 
                        Kryptogram = taxonomyClasses[movement.Specimen.TaxonomyHierarchyView.ClassId].Cryptogram,
                        Datum = movement.Date,
                        Heslo = movement.Partner?.Name
                    });
                }

                movementGroup.PohybZpusobPocetCelkem = movementGroup.Movements.Sum(m => m.Pocet);
                movementGroup.PohybZpusobCenaCelkem = movementGroup.Movements.Sum(m => m.Cena ?? 0m);
                classMovements.Groups.Add(movementGroup);
            }

            classMovements.PohybPocetCelkem = classMovements.Groups.Sum(g => g.PohybZpusobPocetCelkem);
            classMovements.PohybCenaCelkem = classMovements.Groups.Sum(g => g.PohybZpusobCenaCelkem);
            
            classMovementsResult.Add(classMovements);
        }

        var incrementSorts = await dbContext.IncrementReasons.ToDictionaryAsync(r => r.DisplayName, r => r.Sort);
        var decrementSorts = await dbContext.DecrementReasons.ToDictionaryAsync(r => r.DisplayName, r => r.Sort);

        var incrementGroups = movements
            .Where(m => m.IncrementReasonCode != null)
            .GroupBy(m => m.IncrementReason!.DisplayName)
            .Select(g => new
            {
                Sort = incrementSorts.TryGetValue(g.Key, out var s) ? s : 999,
                Item = new MovementSummaryItemDto
                {
                    MovementType = g.Key,
                    Quantity = g.Sum(x => x.Quantity),
                    Price = g.Sum(x => (x.Price ?? 0m) * x.Quantity)
                }
            })
            .OrderBy(x => x.Sort)
            .Select(x => x.Item)
            .ToList();

        var decrementGroups = movements
            .Where(m => m.DecrementReasonCode != null)
            .GroupBy(m => m.DecrementReason!.DisplayName)
            .Select(g => new
            {
                Sort = decrementSorts.TryGetValue(g.Key, out var s) ? s : 999,
                Item = new MovementSummaryItemDto
                {
                    MovementType = g.Key,
                    Quantity = g.Sum(x => x.Quantity),
                    Price = g.Sum(x => (x.Price ?? 0m) * x.Quantity)
                }
            })
            .OrderBy(x => x.Sort)
            .Select(x => x.Item)
            .ToList();

        var fundamentalHerdSummary = new MovementSummaryDto
        {
            Increments = new MovementSummaryGroupDto
            {
                Items = incrementGroups,
                TotalQuantity = incrementGroups.Sum(x => x.Quantity),
                TotalPrice = incrementGroups.Sum(x => x.Price)
            },
            Decrements = new MovementSummaryGroupDto
            {
                Items = decrementGroups,
                TotalQuantity = decrementGroups.Sum(x => x.Quantity),
                TotalPrice = decrementGroups.Sum(x => x.Price)
            }
        };

        classMovementsResult = classMovementsResult.OrderByDescending(c => c.TaxonomyClassName).ToList();

        var result = new EconomyOfMovementSummaryResponse
        {
            ClassMovements = classMovementsResult,
            FundamentalHerd = fundamentalHerdSummary
        };

        return TypedResults.Ok(CommonDtos.SuccessResult<EconomyOfMovementSummaryResponse>.FromItem(result));
    }
}
