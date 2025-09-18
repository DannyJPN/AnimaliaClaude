using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Locations.Endpoints;

public static class LocationsInOrganizationMove
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
    [FromBody] Dtos.LocationsMoveRequest request,
    PziDbContext dbContext)
  {
    var validator = new Validators.LocationsMoveToOrganizationValidator();
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
          "Target district cannot be one of the moved items"
        )
      );
    }

    using var transaction = await dbContext.Database.BeginTransactionAsync();

    var targetDistrict = await dbContext.OrganizationLevels
      .FirstOrDefaultAsync(d => d.Id == request.TargetId);

    if (targetDistrict == null)
    {
      return TypedResults.NotFound();
    }

    var locationsToMove = await dbContext.Locations
      .Where(l => request.Ids.Contains(l.Id))
      .ToListAsync();

    if (locationsToMove.Count == 0 || locationsToMove.Count != request.Ids.Length)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single(
          "ids",
          ErrorCodes.ERR_NOT_FOUND,
          "Some locations were not found"
        )
      );
    }

    var currentDistrictId = locationsToMove.First().OrganizationLevelId;

    if (locationsToMove.Any(l => l.OrganizationLevelId != currentDistrictId))
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single(
          "ids",
          ErrorCodes.ERR_INVALID_VALUE,
          "All locations must belong to the same district"
        )
      );
    }

    if (currentDistrictId == request.TargetId)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single(
          "targetId",
          ErrorCodes.ERR_INVALID_VALUE,
          "Target district must be different from current"
        )
      );
    }

    foreach (var location in locationsToMove)
    {
      location.OrganizationLevelId = request.TargetId;
      location.ModifiedBy = request.ModifiedBy;
      location.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
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
