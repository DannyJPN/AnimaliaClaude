using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.SpeciesDocuments.Endpoints;

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
      var item = await dbContext.DocumentSpecies.FirstOrDefaultAsync(ac => ac.Id == id);
      if (item == null)
      {
        return TypedResults.NotFound();
      }

      var otherValidDocuments = await dbContext.DocumentSpecies
            .Where(m => m.SpeciesId == viewModel.SpeciesId
              && m.IsValid
              && m.Id != item.Id)
            .ToListAsync();

      item.SpeciesId = viewModel.SpeciesId;
      item.Date = viewModel.Date;
      item.DocumentTypeCode = viewModel.DocumentTypeCode;
      item.Number = viewModel.Number;
      item.Note = viewModel.Note;
      item.IsValid = viewModel.IsValid;
      item.ModifiedBy = viewModel.ModifiedBy;
      item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

      if (item.IsValid)
      {
        otherValidDocuments.Add(item);
      }

      var species = await dbContext.Species.FirstAsync(s => s.Id == viewModel.SpeciesId);

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
