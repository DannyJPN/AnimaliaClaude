using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.ExpositionAreas.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<string>>> Handle(
      int id,
      PziDbContext context)
  {
    var area = await context.ExpositionAreas
      .FirstOrDefaultAsync(x => x.Id == id);

    if (area == null)
    {
      return TypedResults.NotFound();
    }

    context.ExpositionAreas.Remove(area);
    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(new ValidationResult())
    );
  }
}
