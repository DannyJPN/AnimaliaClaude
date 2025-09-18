using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;
using PziApi.Models;
using PziApi.Movements;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PziApi.TaxonomyGenera.Endpoints;

public class TaxonomyGenusMoveRequest
{
    public int[] Ids { get; set; } = null!;
    public int TargetId { get; set; }
    public string ModifiedBy { get; set; } = null!;
}

public static class TaxonomyGenusMove
{
    public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] TaxonomyGenusMoveRequest request, PziDbContext dbContext)
    {
        // Validace vstupních parametrů
        var validator = new Validators.TaxonomyGenusMoveValidator();
        var validationResult = validator.Validate(request);

        if (!validationResult.IsValid)
        {
            var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
            return TypedResults.BadRequest(validationErrors);
        }

        using var tx = await dbContext.Database.BeginTransactionAsync();

        // Načtení cílové čeledi (TaxonomyFamily)
        var targetFamily = await dbContext.TaxonomyFamilies
            .Include(f => f.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .FirstOrDefaultAsync(f => f.Id == request.TargetId);

        if (targetFamily == null)
        {
            return TypedResults.NotFound();
        }

        // Načtení rodů, které mají být přesunuty
        var generaToMove = await dbContext.TaxonomyGenera
            .Include(g => g.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .Where(g => request.Ids.Contains(g.Id))
            .ToListAsync();

        if (generaToMove.Count == 0 || generaToMove.Count != request.Ids.Length)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_NOT_FOUND,
                    "Some genera were not found"
                )
            );
        }

        // Kontrola, zda všechny rody patří do stejné čeledi
        var currentFamilyId = generaToMove.First().TaxonomyFamilyId;
        if (generaToMove.Any(g => g.TaxonomyFamilyId != currentFamilyId))
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "All genera must belong to the same family"
                )
            );
        }

        // Kontrola, zda cílová čeleď je jiná než aktuální
        if (currentFamilyId == request.TargetId)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "targetId",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "Target family must be different from current family"
                )
            );
        }

        try
        {
            // Načtení všech druhů pro rody, které budeme přesouvat
            var generaIds = generaToMove.Select(g => g.Id).ToArray();
            var species = await dbContext.Species
                .Include(s => s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
                .Where(s => generaIds.Contains(s.TaxonomyGenusId))
                .ToListAsync();

            // Načtení všech exemplářů pro druhy, které budeme přesouvat
            var speciesIds = species.Select(s => s.Id).ToArray();
            var specimens = await dbContext.Specimens
                .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
                .Where(s => speciesIds.Contains(s.SpeciesId))
                .ToListAsync();

            // Přesun rodů do nové čeledi
            foreach (var genus in generaToMove)
            {
                genus.TaxonomyFamilyId = request.TargetId;
                genus.ModifiedBy = request.ModifiedBy;
                genus.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
            }

            await dbContext.SaveChangesAsync();

            // Přepočet hodnot pro všechny exempláře
            foreach (var specimen in specimens)
            {
                // Aktualizace referencí na novou čeleď
                await dbContext.Entry(specimen.Species!).ReloadAsync();
                await dbContext.Entry(specimen.Species!.TaxonomyGenus!).ReloadAsync();
                await dbContext.Entry(specimen.Species!.TaxonomyGenus!.TaxonomyFamily!).ReloadAsync();

                var movements = await dbContext.Movements
                    .Where(m => m.SpecimenId == specimen.Id)
                    .ToArrayAsync();

                var (
                    speciesCounts,
                    genusCounts,
                    familyCounts,
                    orderCounts,
                    classCounts,
                    phylumCounts
                ) = await QuantityCalculations.GetDataForCalculations(dbContext, specimen);

                QuantityCalculations.UpdateTaxonomyValues(
                    specimen,
                    movements,
                    speciesCounts,
                    genusCounts,
                    familyCounts,
                    orderCounts,
                    classCounts,
                    phylumCounts
                );
            }

            await dbContext.SaveChangesAsync();
            await tx.CommitAsync();

            return TypedResults.Ok(
                CommonDtos.SuccessResult.FromFluentValidation(
                    new FluentValidation.Results.ValidationResult()
                )
            );
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
