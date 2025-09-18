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

namespace PziApi.Specimens.Endpoints;

public class SpecimenMoveRequest
{
    public int[] Ids { get; set; } = null!;
    public int TargetId { get; set; }
    public string ModifiedBy { get; set; } = null!;
}

public static class SpecimenMove
{
    public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] SpecimenMoveRequest request, PziDbContext dbContext)
    {
        // Validace vstupních parametrů
        var validator = new Validators.SpecimenMoveValidator();
        var validationResult = validator.Validate(request);

        if (!validationResult.IsValid)
        {
            var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
            return TypedResults.BadRequest(validationErrors);
        }

        using var tx = await dbContext.Database.BeginTransactionAsync();

        // Načtení cílového druhu (Species)
        var targetSpecies = await dbContext.Species
            .Include(s => s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .FirstOrDefaultAsync(s => s.Id == request.TargetId);

        if (targetSpecies == null)
        {
            return TypedResults.NotFound();
        }

        // Načtení exemplářů, které mají být přesunuty
        var specimensToMove = await dbContext.Specimens
            .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .Where(s => request.Ids.Contains(s.Id))
            .ToListAsync();

        if (specimensToMove.Count == 0 || specimensToMove.Count != request.Ids.Length)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_NOT_FOUND,
                    "Some specimens were not found"
                )
            );
        }

        // Kontrola, zda všechny exempláře patří do stejného druhu
        var currentSpeciesId = specimensToMove.First().SpeciesId;
        if (specimensToMove.Any(s => s.SpeciesId != currentSpeciesId))
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "All specimens must belong to the same species"
                )
            );
        }

        // Kontrola, zda cílový druh je jiný než aktuální
        if (currentSpeciesId == request.TargetId)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "targetId",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "Target species must be different from current species"
                )
            );
        }

        try
        {
            // Přesun exemplářů do nového druhu
            foreach (var specimen in specimensToMove)
            {
                specimen.SpeciesId = request.TargetId;
                specimen.ModifiedBy = request.ModifiedBy;
                specimen.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
            }

            await dbContext.SaveChangesAsync();

            // Přepočet hodnot pro všechny exempláře
            foreach (var specimen in specimensToMove)
            {
                // Aktualizace reference na nový druh
                await dbContext.Entry(specimen).ReloadAsync();
                await dbContext.Entry(specimen.Species!).ReloadAsync();
                await dbContext.Entry(specimen.Species!.TaxonomyGenus!).ReloadAsync();

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
