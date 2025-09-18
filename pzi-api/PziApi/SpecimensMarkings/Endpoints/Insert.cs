using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace PziApi.SpecimensMarkings.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.ItemUpdate viewModel, PziDbContext dbContext)
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
      var specimen = await dbContext.Specimens.FirstAsync(s => s.Id == viewModel.SpecimenId);

      var item = new Models.Marking
      {
        SpecimenId = viewModel.SpecimenId,
        MarkingTypeCode = viewModel.MarkingTypeCode,
        RingNumber = viewModel.RingNumber,
        Color = viewModel.Color,
        Side = viewModel.Side,
        LocatedOn = viewModel.LocatedOn,
        IsValid = viewModel.IsValid,
        MarkingDate = viewModel.MarkingDate,
        Note = viewModel.Note,
        ModifiedBy = viewModel.ModifiedBy,
        ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
      };

      var otherMarkings = await dbContext.Markings
            .Where(m => m.SpecimenId == item.SpecimenId
                && m.IsValid)
            .OrderBy(m => m.MarkingDate)
            .ToListAsync();

      if (item.IsValid)
      {
        otherMarkings.Add(item);
      }

      dbContext.Markings.Add(item);

      var updatedSpecimenMarkings = MarkingsCalculations.CalculateMarkings(otherMarkings);

      specimen.Notch = updatedSpecimenMarkings.Notch;
      specimen.Chip = updatedSpecimenMarkings.Chip;
      specimen.RingNumber = updatedSpecimenMarkings.RingNumber;
      specimen.OtherMarking = updatedSpecimenMarkings.OtherMarking;

      result = new Dtos.Item(
        item.Id,
        item.SpecimenId
      );

      await dbContext.SaveChangesAsync();

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
