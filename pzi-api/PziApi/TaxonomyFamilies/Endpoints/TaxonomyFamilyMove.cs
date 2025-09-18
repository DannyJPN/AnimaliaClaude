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

namespace PziApi.TaxonomyFamilies.Endpoints;

public class TaxonomyFamilyMoveRequest
{
    public int[] Ids { get; set; } = null!;
    public int TargetId { get; set; }
    public string ModifiedBy { get; set; } = null!;
}

public static class TaxonomyFamilyMove
{
    public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] TaxonomyFamilyMoveRequest request, PziDbContext dbContext)
    {
        // Validace vstupních parametrů
        var validator = new Validators.TaxonomyFamilyMoveValidator();
        var validationResult = validator.Validate(request);

        if (!validationResult.IsValid)
        {
            var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
            return TypedResults.BadRequest(validationErrors);
        }

        using var tx = await dbContext.Database.BeginTransactionAsync();

        // Načtení cílového řádu (TaxonomyOrder)
        var targetOrder = await dbContext.TaxonomyOrders
            .Include(o => o.TaxonomyClass!.TaxonomyPhylum)
            .FirstOrDefaultAsync(o => o.Id == request.TargetId);

        if (targetOrder == null)
        {
            return TypedResults.NotFound();
        }

        // Načtení čeledí, které mají být přesunuty
        var familiesToMove = await dbContext.TaxonomyFamilies
            .Include(f => f.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .Where(f => request.Ids.Contains(f.Id))
            .ToListAsync();

        if (familiesToMove.Count == 0 || familiesToMove.Count != request.Ids.Length)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_NOT_FOUND,
                    "Some families were not found"
                )
            );
        }

        // Kontrola, zda všechny čeledi patří do stejného řádu
        var currentOrderId = familiesToMove.First().TaxonomyOrderId;
        if (familiesToMove.Any(f => f.TaxonomyOrderId != currentOrderId))
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "All families must belong to the same order"
                )
            );
        }

        // Kontrola, zda cílový řád je jiný než aktuální
        if (currentOrderId == request.TargetId)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "targetId",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "Target order must be different from current order"
                )
            );
        }

        try
        {
            // Načtení všech rodů pro čeledi, které budeme přesouvat
            var familyIds = familiesToMove.Select(f => f.Id).ToArray();
            var genera = await dbContext.TaxonomyGenera
                .Include(g => g.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
                .Where(g => familyIds.Contains(g.TaxonomyFamilyId))
                .ToListAsync();

            // Načtení všech druhů pro rody, které jsou spojeny s přesouvanými čeleděmi
            var generaIds = genera.Select(g => g.Id).ToArray();
            var species = await dbContext.Species
                .Include(s => s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
                .Where(s => generaIds.Contains(s.TaxonomyGenusId))
                .ToListAsync();

            // Načtení všech exemplářů pro druhy, které jsou spojeny s přesouvanými čeleděmi
            var speciesIds = species.Select(s => s.Id).ToArray();
            var specimens = await dbContext.Specimens
                .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
                .Where(s => speciesIds.Contains(s.SpeciesId))
                .ToListAsync();

            // Přesun čeledí do nového řádu
            foreach (var family in familiesToMove)
            {
                family.TaxonomyOrderId = request.TargetId;
                family.ModifiedBy = request.ModifiedBy;
                family.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
            }

            await dbContext.SaveChangesAsync();

            // Přepočet hodnot pro všechny exempláře
            if (specimens.Count > 0)
            {
                foreach (var specimen in specimens)
                {
                    // Aktualizace referencí na nový řád
                    await dbContext.Entry(specimen.Species!).ReloadAsync();
                    await dbContext.Entry(specimen.Species!.TaxonomyGenus!).ReloadAsync();
                    await dbContext.Entry(specimen.Species!.TaxonomyGenus!.TaxonomyFamily!).ReloadAsync();
                    await dbContext.Entry(specimen.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!).ReloadAsync();

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
            }

            await tx.CommitAsync();

            return TypedResults.Ok(
                CommonDtos.SuccessResult.FromFluentValidation(
                    new FluentValidation.Results.ValidationResult()
                )
            );
        }
        catch (System.Exception)
        {
            await tx.RollbackAsync();
            throw;
        }
    }
}
