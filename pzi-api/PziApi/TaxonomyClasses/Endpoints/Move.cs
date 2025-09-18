using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;
using PziApi.Movements;

namespace PziApi.TaxonomyClasses.Endpoints;

public static class TaxonomyClassMove
{
    public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
        [FromBody] Dtos.TaxonomyClassMoveRequest request,
        PziDbContext dbContext)
    {
        var validator = new Validators.TaxonomyClassMoveValidator();
        var validationResult = validator.Validate(request);

        if (!validationResult.IsValid)
        {
            var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
            return TypedResults.BadRequest(validationErrors);
        }

        using var tx = await dbContext.Database.BeginTransactionAsync();

        var targetPhylum = await dbContext.TaxonomyPhyla
            .FirstOrDefaultAsync(p => p.Id == request.TargetId);

        if (targetPhylum == null)
        {
            return TypedResults.NotFound();
        }

        var classesToMove = await dbContext.TaxonomyClasses
            .Include(c => c.TaxonomyPhylum)
            .Where(c => request.Ids.Contains(c.Id))
            .ToListAsync();

        if (classesToMove.Count == 0 || classesToMove.Count != request.Ids.Length)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_NOT_FOUND,
                    "Some classes were not found"
                )
            );
        }

        var currentPhylumId = classesToMove.First().TaxonomyPhylumId;
        if (classesToMove.Any(c => c.TaxonomyPhylumId != currentPhylumId))
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "ids",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "All classes must belong to the same phylum"
                )
            );
        }

        if (currentPhylumId == request.TargetId)
        {
            return TypedResults.BadRequest(
                CommonDtos.ValidationErrors.Single(
                    "targetId",
                    ErrorCodes.ERR_INVALID_VALUE,
                    "Target phylum must be different from current phylum"
                )
            );
        }

        var movedClassesCounts = classesToMove
            .GroupBy(e => e.TaxonomyPhylumId)
            .Select(eg => new
            {
                QuantityOwned = eg.Sum(g => g.QuantityOwned),
                QuantityInZoo = eg.Sum(g => g.QuantityInZoo),
                QuantityDeponatedFrom = eg.Sum(g => g.QuantityDeponatedFrom),
                QuantityDeponatedTo = eg.Sum(g => g.QuantityDeponatedTo)
            })
            .First();

        var currentPhylum = await dbContext.TaxonomyPhyla
            .FirstAsync(p => p.Id == currentPhylumId);

        foreach (var classToMove in classesToMove)
        {
            classToMove.TaxonomyPhylumId = request.TargetId;
            classToMove.ModifiedBy = request.ModifiedBy;
            classToMove.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
        }

        currentPhylum.QuantityOwned -= movedClassesCounts.QuantityOwned;
        currentPhylum.QuantityInZoo -= movedClassesCounts.QuantityInZoo;
        currentPhylum.QuantityDeponatedFrom -= movedClassesCounts.QuantityDeponatedFrom;
        currentPhylum.QuantityDeponatedTo -= movedClassesCounts.QuantityDeponatedTo;
        currentPhylum.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
            currentPhylum.QuantityInZoo,
            currentPhylum.QuantityDeponatedTo
        );

        targetPhylum.QuantityOwned += movedClassesCounts.QuantityOwned;
        targetPhylum.QuantityInZoo += movedClassesCounts.QuantityInZoo;
        targetPhylum.QuantityDeponatedFrom += movedClassesCounts.QuantityDeponatedFrom;
        targetPhylum.QuantityDeponatedTo += movedClassesCounts.QuantityDeponatedTo;
        targetPhylum.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
            targetPhylum.QuantityInZoo,
            targetPhylum.QuantityDeponatedTo
        );

        await dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        return TypedResults.Ok(
            CommonDtos.SuccessResult.FromFluentValidation(
                new FluentValidation.Results.ValidationResult()
            )
        );
    }
}
