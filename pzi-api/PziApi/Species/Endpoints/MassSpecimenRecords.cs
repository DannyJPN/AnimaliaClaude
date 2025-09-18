using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Species.Endpoints;

public static class MassSpecimenRecords
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.MassSpecimenRecordsRequest request, PziDbContext dbContext)
  {
    var validator = new Validators.MassSpecimenRecordsRequestValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var specimensInZoo = await dbContext.Specimens
            .Where(s => s.SpeciesId == request.SpeciesId && s.QuantityInZoo > 0)
            .ToArrayAsync();

      var newSpecimenRecords = specimensInZoo
            .Select((s) =>
      {
        var item = new Models.RecordSpecimen
        {
          SpecimenId = s.Id,
          Date = request.Date!,
          ActionTypeCode = request.ActionTypeCode,
          Note = request.Note,
          PartnerId = null,
          ModifiedBy = request.ModifiedBy,
          ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
        };

        return item;
      })
      .ToArray();

      await dbContext.RecordSpecimens.AddRangeAsync(newSpecimenRecords);

      await dbContext.SaveChangesAsync();

      await tx.CommitAsync();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(new FluentValidation.Results.ValidationResult())
    );
  }
}