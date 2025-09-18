using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.SpecimensMarkings.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.ItemUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.UpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    Dtos.Item result;

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var item = await dbContext.Markings
            .Include(m => m.Specimen)
            .FirstOrDefaultAsync(ac => ac.Id == id);

      if (item == null)
      {
        return TypedResults.NotFound();
      }

      item.SpecimenId = viewModel.SpecimenId;
      item.MarkingTypeCode = viewModel.MarkingTypeCode;
      item.RingNumber = viewModel.RingNumber;
      item.Color = viewModel.Color;
      item.Side = viewModel.Side;
      item.LocatedOn = viewModel.LocatedOn;
      item.IsValid = viewModel.IsValid;
      item.MarkingDate = viewModel.MarkingDate;
      item.Note = viewModel.Note;
      item.ModifiedBy = viewModel.ModifiedBy;
      item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

      var otherMarkings = await dbContext.Markings
            .Where(m => m.SpecimenId == item.SpecimenId
                && m.IsValid
                && m.Id != item.Id)
            .OrderBy(m => m.MarkingDate)
            .ToListAsync();

      if (item.IsValid)
      {
        otherMarkings.Add(item);
      }

      var updatedSpecimenMarkings = MarkingsCalculations.CalculateMarkings(otherMarkings);

      item.Specimen!.Notch = updatedSpecimenMarkings.Notch;
      item.Specimen!.Chip = updatedSpecimenMarkings.Chip;
      item.Specimen!.RingNumber = updatedSpecimenMarkings.RingNumber;
      item.Specimen!.OtherMarking = updatedSpecimenMarkings.OtherMarking;

      await dbContext.SaveChangesAsync();

      result = new Dtos.Item(
        item.Id,
        item.SpecimenId
      );

      await tx.CommitAsync();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
        result,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
