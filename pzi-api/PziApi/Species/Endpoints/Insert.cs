using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.Species.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Species>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.SpeciesUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.SpeciesUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = new Models.Species
    {
      TaxonomyGenusId = viewModel.TaxonomyGenusId,
      Code = viewModel.Code,
      NameCz = viewModel.NameCz,
      NameLat = viewModel.NameLat,
      NameEn = viewModel.NameEn,
      NameSk = viewModel.NameSk,
      Card = viewModel.Card,
      IsEep = viewModel.IsEep,
      IsEsb = viewModel.IsEsb,
      IsIsb = viewModel.IsIsb,
      IsGenePool = viewModel.IsGenePool,
      IsRegulationRequirement = viewModel.IsRegulationRequirement,
      ClassificationTypeCode = viewModel.ClassificationTypeCode,
      RegionId = viewModel.RegionId,
      Note = viewModel.Note,
      Synonyms = viewModel.Synonyms,
      Description = viewModel.Description,
      SourceType = 'N',
      ZooStatus = "N",
      IsEuFauna = viewModel.IsEuFauna,
      ModifiedBy = viewModel.ModifiedBy,
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
    };

    dbContext.Species.Add(item);

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
