using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Partners.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(
    int id,
    PziDbContext dbContext)
  {
    var partner = await dbContext.Partners.FirstOrDefaultAsync(m => m.Id == id);
    if (partner == null)
    {
      return TypedResults.NotFound();
    }

    dbContext.Partners.Remove(partner);
    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
