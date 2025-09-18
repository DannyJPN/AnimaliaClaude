// Sestavy / Zoologie -  kompletni seznam -ARKS (P3)
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpecimensByZimsRange
{
  public record Request(string MinZims, string MaxZims);

  public class SpecimenDto
  {
    public int? AccessionNumber { get; set; }
    public string? Zims { get; set; }
    public string? NameLat { get; set; }
    public string? NameCz { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpecimenDto[]>>, BadRequest<string>>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    if (string.IsNullOrEmpty(request.MinZims) || string.IsNullOrEmpty(request.MaxZims))
    {
      return TypedResults.BadRequest("Both MinZims and MaxZims are required.");
    }

    var results = await dbContext.Specimens
        .Where(s => s.Zims != null)
        .Where(s => s.Zims!.CompareTo(request.MinZims) >= 0)
        .Where(s => s.Zims!.CompareTo(request.MaxZims) <= 0)
        .OrderBy(s => s.Zims)
        .Select(s => new SpecimenDto
        {
          AccessionNumber = s.AccessionNumber,
          Zims = s.Zims,
          NameLat = s.Species!.NameLat,
          NameCz = s.Species.NameCz
        })
        .ToArrayAsync();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpecimenDto[]>.FromItemAndFluentValidation(
            results,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
