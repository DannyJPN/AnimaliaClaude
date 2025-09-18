using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;
using PziApi.Movements;

namespace PziApi.TaxonomyOrders.Endpoints;


public static class TaxonomyOrderMove
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      [FromBody] Dtos.TaxonomyOrderMoveRequest request,
      PziDbContext dbContext)
  {
    // Validate input parameters
    var validator = new Validators.TaxonomyOrderMoveValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    using var tx = await dbContext.Database.BeginTransactionAsync();

    // Load target class
    var targetClass = await dbContext.TaxonomyClasses
        .Include(c => c.TaxonomyPhylum)
        .FirstOrDefaultAsync(c => c.Id == request.TargetId);

    if (targetClass == null)
    {
      return TypedResults.NotFound();
    }

    // Load orders to be moved
    var ordersToMove = await dbContext.TaxonomyOrders
        .Include(o => o.TaxonomyClass!.TaxonomyPhylum)
        .Where(o => request.Ids.Contains(o.Id))
        .ToListAsync();

    if (ordersToMove.Count == 0 || ordersToMove.Count != request.Ids.Length)
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single(
              "ids",
              ErrorCodes.ERR_NOT_FOUND,
              "Some orders were not found"
          )
      );
    }

    // Check if all orders belong to the same class
    var currentClassId = ordersToMove.First().TaxonomyClassId;
    if (ordersToMove.Any(o => o.TaxonomyClassId != currentClassId))
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single(
              "ids",
              ErrorCodes.ERR_INVALID_VALUE,
              "All orders must belong to the same class"
          )
      );
    }

    // Check if target class is different from current class
    if (currentClassId == request.TargetId)
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single(
              "targetId",
              ErrorCodes.ERR_INVALID_VALUE,
              "Target class must be different from current class"
          )
      );
    }

    var movedOrdersCounts = ordersToMove
          .GroupBy(e => e.TaxonomyClassId)
          .Select(eg => new
          {
            QuantityOwned = eg.Sum(g => g.QuantityOwned),
            QuantityInZoo = eg.Sum(g => g.QuantityInZoo),
            QuantityDeponatedFrom = eg.Sum(g => g.QuantityDeponatedFrom),
            QuantityDeponatedTo = eg.Sum(g => g.QuantityDeponatedTo)
          })
      .First();

    var currentClass = await dbContext.TaxonomyClasses
      .Include(c => c.TaxonomyPhylum)
      .FirstAsync(c => c.Id == currentClassId);

    // Move orders to the new class
    foreach (var order in ordersToMove)
    {
      order.TaxonomyClassId = request.TargetId;
      order.ModifiedBy = request.ModifiedBy;
      order.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
    }

    currentClass.QuantityOwned -= movedOrdersCounts!.QuantityOwned;
    currentClass.QuantityInZoo -= movedOrdersCounts!.QuantityInZoo;
    currentClass.QuantityDeponatedFrom -= movedOrdersCounts!.QuantityDeponatedFrom;
    currentClass.QuantityDeponatedTo -= movedOrdersCounts!.QuantityDeponatedTo;
    currentClass!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      currentClass!.QuantityInZoo,
      currentClass!.QuantityDeponatedTo
    );

    currentClass.TaxonomyPhylum!.QuantityOwned -= movedOrdersCounts!.QuantityOwned;
    currentClass.TaxonomyPhylum!.QuantityInZoo -= movedOrdersCounts!.QuantityInZoo;
    currentClass.TaxonomyPhylum!.QuantityDeponatedFrom -= movedOrdersCounts!.QuantityDeponatedFrom;
    currentClass.TaxonomyPhylum!.QuantityDeponatedTo -= movedOrdersCounts!.QuantityDeponatedTo;
    currentClass.TaxonomyPhylum!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      currentClass.TaxonomyPhylum!.QuantityInZoo,
      currentClass.TaxonomyPhylum!.QuantityDeponatedTo
    );

    targetClass.QuantityOwned += movedOrdersCounts!.QuantityOwned;
    targetClass.QuantityInZoo += movedOrdersCounts!.QuantityInZoo;
    targetClass.QuantityDeponatedFrom += movedOrdersCounts!.QuantityDeponatedFrom;
    targetClass.QuantityDeponatedTo += movedOrdersCounts!.QuantityDeponatedTo;
    targetClass.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      targetClass.QuantityInZoo,
      targetClass.QuantityDeponatedTo
    );

    targetClass.TaxonomyPhylum!.QuantityOwned += movedOrdersCounts!.QuantityOwned;
    targetClass.TaxonomyPhylum!.QuantityInZoo += movedOrdersCounts!.QuantityInZoo;
    targetClass.TaxonomyPhylum!.QuantityDeponatedFrom += movedOrdersCounts!.QuantityDeponatedFrom;
    targetClass.TaxonomyPhylum!.QuantityDeponatedTo += movedOrdersCounts!.QuantityDeponatedTo;
    targetClass.TaxonomyPhylum!.ZooStatus = QuantityCalculations.CalculateZooStatusFromQuantities(
      targetClass.TaxonomyPhylum!.QuantityInZoo,
      targetClass.TaxonomyPhylum!.QuantityDeponatedTo
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
