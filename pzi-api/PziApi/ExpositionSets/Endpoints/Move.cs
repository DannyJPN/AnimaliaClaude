using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.ExpositionSets.Endpoints;

public static class ExpositionSetMove
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
    [FromBody] Dtos.ExpositionSetMoveRequest request,
    PziDbContext dbContext)
  {
    if (request.Ids.Contains(request.TargetId))
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single(
          "targetId",
          ErrorCodes.ERR_INVALID_VALUE,
          "Target exposition area cannot be one of the moved items"
        )
      );
    }

    using var transaction = await dbContext.Database.BeginTransactionAsync();

    var targetArea = await dbContext.ExpositionAreas
      .FirstOrDefaultAsync(a => a.Id == request.TargetId);

    if (targetArea == null)
    {
      return TypedResults.NotFound();
    }

    var setsToMove = await dbContext.ExpositionSets
      .Where(s => request.Ids.Contains(s.Id))
      .ToListAsync();

    if (setsToMove.Count == 0 || setsToMove.Count != request.Ids.Length)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single(
          "ids",
          ErrorCodes.ERR_NOT_FOUND,
          "Some exposition sets were not found"
        )
      );
    }

    var currentAreaId = setsToMove.First().ExpositionAreaId;

    if (setsToMove.Any(s => s.ExpositionAreaId != currentAreaId))
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single(
          "ids",
          ErrorCodes.ERR_INVALID_VALUE,
          "All exposition sets must belong to the same exposition area"
        )
      );
    }

    if (currentAreaId == request.TargetId)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single(
          "targetId",
          ErrorCodes.ERR_INVALID_VALUE,
          "Target exposition area must be different from current"
        )
      );
    }

    foreach (var set in setsToMove)
    {
      set.ExpositionAreaId = request.TargetId;
      set.ModifiedBy = request.ModifiedBy;
      set.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
    }

    await dbContext.SaveChangesAsync();
    await transaction.CommitAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
