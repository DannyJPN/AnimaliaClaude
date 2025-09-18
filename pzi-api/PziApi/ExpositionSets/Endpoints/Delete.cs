using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.ExpositionSets.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<string>>> Handle(
      int id,
      PziDbContext context)
  {
    var set = await context.ExpositionSets
      .FirstOrDefaultAsync(x => x.Id == id);

    if (set == null)
    {
      return TypedResults.NotFound();
    }

    context.ExpositionSets.Remove(set);
    await context.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(new ValidationResult())
    );
  }
}
