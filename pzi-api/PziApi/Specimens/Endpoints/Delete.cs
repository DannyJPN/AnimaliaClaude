using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Specimens;

public class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, PziDbContext dbContext)
  {
    var item = await dbContext.Specimens.FirstOrDefaultAsync(m => m.Id == id);

    if (item == null)
    {
      return TypedResults.NotFound();
    }

    var itemRelations = await dbContext.Specimens
            .Select(s => new
            {
              s.Id,
              ImagesCount = s.Images!.Count(),
              MovementsCount = s.Movements!.Count(),
              CadaversCount = s.Cadavers!.Count(),
              SpecimenDocumentsCount = s.SpecimenDocuments!.Count(),
              MarkingsCount = s.Markings!.Count(),
              PlacementsCount = s.Placements!.Count(),
              RecordsCount = s.Records!.Count(),
              JournalMovementEntriesCount = s.JournalMovementEntries!.Count(),
              JournalBioEntriesCount = s.JournalBioEntries!.Count()
            })
            .FirstAsync(s => s.Id == id);

    if (itemRelations.ImagesCount > 0
      || itemRelations.MovementsCount > 0
      || itemRelations.CadaversCount > 0
      || itemRelations.SpecimenDocumentsCount > 0
      || itemRelations.MarkingsCount > 0
      || itemRelations.PlacementsCount > 0
      || itemRelations.RecordsCount > 0
      || itemRelations.JournalMovementEntriesCount > 0
      || itemRelations.JournalBioEntriesCount > 0)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("", "ERR_ENTITY_IN_REFERENCED", "Entity is referenced")
      );
    }

    dbContext.Specimens.Remove(item);

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new ValidationResult()
      )
    );
  }
}
