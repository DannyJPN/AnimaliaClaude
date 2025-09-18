using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.OrganizationLevels.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(
      int id,
      PziDbContext context)
  {
    var organizationLevel = await context.OrganizationLevels.FirstOrDefaultAsync(m => m.Id == id);
    if (organizationLevel == null)
    {
      return TypedResults.NotFound();
    }

    context.OrganizationLevels.Remove(organizationLevel);
    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
