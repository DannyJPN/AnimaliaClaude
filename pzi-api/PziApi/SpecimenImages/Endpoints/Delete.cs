using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.SpecimenImages.Endpoints;

public class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(int id, PziDbContext dbContext)
  {
    var item = await dbContext.SpecimenImages.FirstOrDefaultAsync(m => m.Id == id);

    if (item == null)
    {
      return TypedResults.NotFound();
    }

    dbContext.SpecimenImages.Remove(item);

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
