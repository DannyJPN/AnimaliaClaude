using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.SpeciesDocuments.Endpoints;

public class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(int id, PziDbContext dbContext)
  {
    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var item = await dbContext.DocumentSpecies
            .FirstOrDefaultAsync(m => m.Id == id);

      if (item == null)
      {
        return TypedResults.NotFound();
      }
      var species = await dbContext.Species.FirstAsync(s => s.Id == item.SpeciesId);

      var otherValidDocuments = await dbContext.DocumentSpecies
        .Where(m => m.SpeciesId == item.SpeciesId
          && m.IsValid
          && m.Id != item.Id)
        .OrderBy(m => m.Date)
        .ToArrayAsync();

      dbContext.DocumentSpecies.Remove(item);

      var crExceptions = otherValidDocuments
              .Where(d => d.DocumentTypeCode == "V")
              .Select(d => d.Number)
              .ToArray();

      var euDivergences = otherValidDocuments
            .Where(d => d.DocumentTypeCode == "O")
            .Select(d => d.Number)
            .ToArray();

      species.CrExceptionRefNumber = crExceptions.Length > 0
        ? string.Join(", ", crExceptions)
        : null;

      species.EuFaunaRefNumber = euDivergences.Length > 0
        ? string.Join(", ", euDivergences)
        : null;

      await dbContext.SaveChangesAsync();

      await tx.CommitAsync();

      return TypedResults.Ok(
        CommonDtos.SuccessResult.FromFluentValidation(
          new ValidationResult()
        )
      );
    }
  }
}
