// NOT USED

using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpeciesNote
{
  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? Note { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesDto>>, NotFound>> Handle(int speciesId, PziDbContext dbContext)
  {
    var speciesResult = await dbContext.Species
      .Where(s => s.Id == speciesId)
      .Select(s => new SpeciesDto
      {
        Id = s.Id,
        NameCz = s.NameCz,
        NameLat = s.NameLat,
        Note = s.Note
      })
      .SingleOrDefaultAsync();

    if (speciesResult == null)
      return TypedResults.NotFound();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<SpeciesDto>.FromItemAndFluentValidation(
        speciesResult,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
