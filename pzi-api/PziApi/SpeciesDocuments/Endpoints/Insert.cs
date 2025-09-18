using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace PziApi.SpeciesDocuments.Endpoints;

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
      var item = new Models.DocumentSpecies
      {
        SpeciesId = viewModel.SpeciesId,
        Date = viewModel.Date,
        DocumentTypeCode = viewModel.DocumentTypeCode,
        Number = viewModel.Number,
        Note = viewModel.Note,
        IsValid = viewModel.IsValid,
        ModifiedBy = viewModel.ModifiedBy,
        ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
      };

      if (item.IsValid)
      {
        var species = await dbContext.Species.FirstAsync(s => s.Id == viewModel.SpeciesId);

        var otherValidDocuments = await dbContext.DocumentSpecies
              .Where(m => m.SpeciesId == viewModel.SpeciesId
                && m.IsValid)
              .ToListAsync();

        otherValidDocuments.Add(item);

        var crExceptions = otherValidDocuments.OrderBy(d => d.Date)
          .Where(d => d.DocumentTypeCode == "V")
          .Select(d => d.Number)
          .ToList();

        var euDivergences = otherValidDocuments.OrderBy(d => d.Date)
          .Where(d => d.DocumentTypeCode == "O")
              .Select(d => d.Number)
              .ToList();

        species.CrExceptionRefNumber = crExceptions.Count > 0
          ? string.Join(", ", crExceptions)
          : null;

        species.EuFaunaRefNumber = euDivergences.Count > 0
          ? string.Join(", ", euDivergences)
          : null;
      }

      dbContext.DocumentSpecies.Add(item);

      await dbContext.SaveChangesAsync();

      result = new Dtos.Item(
        item.Id,
        item.SpeciesId
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
