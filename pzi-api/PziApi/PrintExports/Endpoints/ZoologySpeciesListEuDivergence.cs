using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
// Sestavy/Programy-Zoologie- Prehled druhu eu odchylka

using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class ZoologySpeciesListEuDivergence
{
  public class Request { }

  public class ResultRow
  {
    public string? NameLat { get; set; }
    public string? NameCz { get; set; }
    public string? EuFaunaRefNumber { get; set; }
    public string? CrExceptionRefNumber { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<ResultRow[]>>, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    var species = await dbContext.Species
        .Where(s => s.IsEuFauna
          && ((s.EuFaunaRefNumber == null || s.EuFaunaRefNumber == "") || (s.CrExceptionRefNumber == null || s.CrExceptionRefNumber == ""))
          && s.Specimens!.Any(sp => sp.OutReasonCode == null))
        .OrderBy(s => s.NameLat)
        .ToArrayAsync();

    var responseData = species
      .Select((s) =>
      {
        return new ResultRow
        {
          CrExceptionRefNumber = s.CrExceptionRefNumber,
          EuFaunaRefNumber = s.EuFaunaRefNumber,
          NameCz = s.NameCz,
          NameLat = s.NameLat
        };
      })
      .ToArray();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<ResultRow[]>.FromItemAndFluentValidation(
            responseData,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}