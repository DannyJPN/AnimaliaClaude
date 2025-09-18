using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.BirthMethods.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(
    string code,
    PziDbContext dbContext)
  {
    var item = await dbContext.BirthMethods.FirstOrDefaultAsync(m => m.Code == code);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    dbContext.BirthMethods.Remove(item);
    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
