using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.SpecimensMarkings.Endpoints;

public class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound>> Handle(int id, PziDbContext dbContext)
  {
    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var item = await dbContext.Markings
                  .Include(m => m.Specimen)
                  .FirstOrDefaultAsync(m => m.Id == id);

      if (item == null)
      {
        return TypedResults.NotFound();
      }

      var otherMarkings = await dbContext.Markings
            .Where(m => m.SpecimenId == item.SpecimenId
                && m.IsValid
                && m.Id != item.Id)
            .OrderBy(m => m.MarkingDate)
            .ToArrayAsync();

      dbContext.Markings.Remove(item);

      var updatedSpecimenMarkings = MarkingsCalculations.CalculateMarkings(otherMarkings);

      item.Specimen!.Notch = updatedSpecimenMarkings.Notch;
      item.Specimen!.Chip = updatedSpecimenMarkings.Chip;
      item.Specimen!.RingNumber = updatedSpecimenMarkings.RingNumber;
      item.Specimen!.OtherMarking = updatedSpecimenMarkings.OtherMarking;

      await dbContext.SaveChangesAsync();

      await tx.CommitAsync();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
