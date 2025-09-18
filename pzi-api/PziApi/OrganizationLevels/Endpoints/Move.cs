using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.OrganizationLevels.Endpoints;

public static class OrganizationsClassMove
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      [FromBody] Dtos.OrganizationsLevelMoveRequest request,
      PziDbContext dbContext)
  {
    var validator = new Validators.OrganizationsClassMoveValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    if (request.Ids.Contains(request.TargetId))
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single(
              "targetId",
              ErrorCodes.ERR_INVALID_VALUE,
              "Target organization cannot be one of the moved items"
          )
      );
    }

    using var transaction = await dbContext.Database.BeginTransactionAsync();

    var targetOrg = await dbContext.OrganizationLevels
        .FirstOrDefaultAsync(p => p.Id == request.TargetId);

    if (targetOrg == null)
    {
      return TypedResults.NotFound();
    }

    var levelsToMove = await dbContext.OrganizationLevels
        .Include(c => c.Parent)
        .Where(c => request.Ids.Contains(c.Id))
        .ToListAsync();

    if (levelsToMove.Count == 0 || levelsToMove.Count != request.Ids.Length)
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single(
              "ids",
              ErrorCodes.ERR_NOT_FOUND,
              "Some classes were not found"
          )
      );
    }

    var currentParentId = levelsToMove.First().ParentId;

    if (levelsToMove.Any(c => c.ParentId != currentParentId))
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single(
              "ids",
              ErrorCodes.ERR_INVALID_VALUE,
              "All classes must belong to the same parent"
          )
      );
    }

    if (currentParentId == request.TargetId)
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single(
              "targetId",
              ErrorCodes.ERR_INVALID_VALUE,
              "Target parent must be different from current organization"
          )
      );
    }

    var sourceLevel = levelsToMove.First().Level;
    var targetLevel = targetOrg.Level;

    bool isValidHierarchy = sourceLevel switch
    {
      "district" => targetLevel == "workplace",
      "workplace" => targetLevel == "department",
      "department" => false,
      _ => false
    };

    if (!isValidHierarchy)
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single(
              "targetId",
              ErrorCodes.ERR_INVALID_VALUE,
              $"Invalid target level '{targetLevel}' for source level '{sourceLevel}'"
          )
      );
    }

    foreach (var itemToMove in levelsToMove)
    {
      itemToMove.ParentId = request.TargetId;
      itemToMove.ModifiedBy = request.ModifiedBy;
      itemToMove.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
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
