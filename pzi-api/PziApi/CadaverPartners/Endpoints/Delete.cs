using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.CadaverPartners.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(
    int id,
    PziDbContext dbContext)
  {
    var cadaverPartner = await dbContext.CadaverPartners.FirstOrDefaultAsync(m => m.Id == id);
    if (cadaverPartner == null)
    {
      return TypedResults.NotFound();
    }

    dbContext.CadaverPartners.Remove(cadaverPartner);
    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
