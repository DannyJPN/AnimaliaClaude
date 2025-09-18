using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Locations.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(
      int id,
      PziDbContext context)
  {
    var location = await context.Locations.FirstOrDefaultAsync(m => m.Id == id);
    if (location == null)
    {
      return TypedResults.NotFound();
    }

    context.Locations.Remove(location);
    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
