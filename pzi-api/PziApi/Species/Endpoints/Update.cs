using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.Species.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Species>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.SpeciesUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.SpeciesUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.Species.FirstOrDefaultAsync(ac => ac.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.Code = viewModel.Code;
    item.NameCz = viewModel.NameCz;
    item.NameLat = viewModel.NameLat;
    item.NameEn = viewModel.NameEn;
    item.NameSk = viewModel.NameSk;
    item.Card = viewModel.Card;
    item.IsEep = viewModel.IsEep;
    item.IsEsb = viewModel.IsEsb;
    item.IsIsb = viewModel.IsIsb;
    item.IsGenePool = viewModel.IsGenePool;
    item.ClassificationTypeCode = viewModel.ClassificationTypeCode;
    item.RegionId = viewModel.RegionId;
    item.Note = viewModel.Note;
    item.Synonyms = viewModel.Synonyms;
    item.Description = viewModel.Description;
    item.ModifiedBy = viewModel.ModifiedBy;
    item.IsRegulationRequirement = viewModel.IsRegulationRequirement;
    item.IsEuFauna = viewModel.IsEuFauna;
    item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Species>.FromItemAndFluentValidation(
        new Dtos.Species(
          item.Id,
          item.TaxonomyGenusId
        ),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
