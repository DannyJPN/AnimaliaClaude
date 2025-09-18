using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;

namespace PziApi.Species.Endpoints;

public class SpeciesMoveRequest
{
    public int[] Ids { get; set; } = null!;
    public int TargetId { get; set; }
    public string ModifiedBy { get; set; } = null!;
}

public static class SpeciesMove
{
    public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] SpeciesMoveRequest request, PziDbContext dbContext)
    {
        // Validace vstupních parametrů
        var validator = new Validators.SpeciesMoveValidator();
        var validationResult = validator.Validate(request);

        if (!validationResult.IsValid)
        {
            var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
            return TypedResults.BadRequest(validationErrors);
        }

        using var tx = await dbContext.Database.BeginTransactionAsync();
        // Načtení cílového rodu (TaxonomyGenus)
        var targetGenus = await dbContext.TaxonomyGenera
            .Include(g => g.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .FirstOrDefaultAsync(g => g.Id == request.TargetId);

        if (targetGenus == null)
        {
            return TypedResults.NotFound();
        }

        // Načtení druhů, které mají být přesunuty
        var speciesToMove = await dbContext.Species
            .Include(s => s.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .Where(s => request.Ids.Contains(s.Id))
            .ToListAsync();

        if (speciesToMove.Count == 0 || speciesToMove.Count != request.Ids.Length)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_NOT_FOUND,
                    "Some species were not found"
                )
            );
        }

        // Kontrola, zda všechny druhy patří do stejného rodu
        var currentGenusId = speciesToMove.First().TaxonomyGenusId;
        if (speciesToMove.Any(s => s.TaxonomyGenusId != currentGenusId))
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "All species must belong to the same genus"
                )
            );
        }

        // Kontrola, zda cílový rod je jiný než aktuální
        if (currentGenusId == request.TargetId)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "targetId",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "Target genus must be different from current genus"
                )
            );
        }


        try
        {
            // Načtení všech exemplářů pro druhy, které budeme přesouvat
            var speciesIds = speciesToMove.Select(s => s.Id).ToArray();
            var specimens = await dbContext.Specimens
                .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
                .Where(s => speciesIds.Contains(s.SpeciesId))
                .ToListAsync();

            // Přesun druhů do nového rodu
            foreach (var species in speciesToMove)
            {
                species.TaxonomyGenusId = request.TargetId;
                species.ModifiedBy = request.ModifiedBy;
                species.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
            }

            await dbContext.SaveChangesAsync();

            // Přepočet hodnot pro všechny exempláře
            foreach (var specimen in specimens)
            {
                // Aktualizace reference na nový rod
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
