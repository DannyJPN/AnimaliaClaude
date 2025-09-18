using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Zoos.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(
    string id,
    PziDbContext dbContext)
  {
    var item = await dbContext.Zoos.FirstOrDefaultAsync(m => m.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    dbContext.Zoos.Remove(item);
    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
