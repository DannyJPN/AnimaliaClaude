using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class RegistrationExportByEuPermit
{
  public record Request(string? MinReg, string? MaxReg);

  public record ResponseDto(
      int Id,
      int AccessionNumber,
      string? Zims,
      string? SpeciesNameLat,
      string? SpeciesNameCz,
      string? OutDate,
      string? OutReason,
      string? OutLocation,
      string? OutLocationName,
      string? EuPermit);

  public static async Task<Results<Ok<CommonDtos.SuccessResult<IList<ResponseDto>>>, NotFound, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
    [FromBody] Request request,
    PziDbContext dbContext)
  {
    var specimens = await dbContext.Specimens
        .Where(s => !string.IsNullOrEmpty(s.EuPermit))
        .Where(s => (string.Compare(s.EuPermit, request.MinReg) >= 0 && string.Compare(s.EuPermit, request.MaxReg) < 0) 
            || EF.Functions.Like(s.EuPermit, $"%{request.MinReg}%") 
            || EF.Functions.Like(s.EuPermit, $"%{request.MaxReg}%")
        )
        .OrderBy(s => s.EuPermit)
        .ThenByDescending(s => s.Species!.ModifiedAt)
        .Select(s => new ResponseDto(
            s.Id,
            s.AccessionNumber ?? 0,
            s.Zims,
            s.Species!.NameLat,
            s.Species.NameCz,
            s.OutDate,
            s.OutReason == null ? null : s.OutReason.DisplayName,
            s.OutLocation == null ? null : s.OutLocation.Keyword,
            s.OutLocation == null ? null : s.OutLocation.Name,
            s.EuPermit)
          )
        .ToListAsync();

    if (!specimens.Any())
    {
      return TypedResults.NotFound();
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<IList<ResponseDto>>.FromItemAndFluentValidation(
            specimens,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
