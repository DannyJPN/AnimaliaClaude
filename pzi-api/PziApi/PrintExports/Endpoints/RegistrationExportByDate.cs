using FluentValidation;
using Microsoft.AspNetCore.Builder.Extensions;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class RegistrationExportByDate
{
  public record Request(string MinDate, string MaxDate);

  public record ResponseDto(
      int Id,
      int AccessionNumber,
      string? RegistrationNumber,
      string? EuPermit,
      string? Zims,
      string? RegisteredDate,
      string? RegisteredTo,
      string? SpeciesNameLat,
      string? SpeciesNameCz,
      string? OutDate,
      string? OutReason,
      string? OutLocation);

  public static async Task<Results<Ok<CommonDtos.SuccessResult<IList<ResponseDto>>>, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    var specimens = await dbContext.Specimens
        .Include(s => s.Species)
        .Include(s => s.OutLocation)
        .Include(s => s.OutReason)
        .Where(s => !string.IsNullOrEmpty(s.RegistrationNumber))
        .Where(s => string.Compare(s.OutDate, request.MinDate) >= 0 &&
                    string.Compare(s.OutDate, request.MaxDate) <= 0)

        .OrderBy(s => s.OutDate)
        .ThenByDescending(s => s.RegistrationNumber)
        .Select(s => new ResponseDto(
            s.Id,
            s.AccessionNumber ?? 0,
            s.RegistrationNumber,
            s.EuPermit,
            s.Zims,
            s.RegisteredDate,
            s.RegisteredTo,
            s.Species!.NameLat,
            s.Species.NameCz,
            s.OutDate,
            s.OutReason == null ? null : s.OutReason.DisplayName,
            s.OutLocation == null ? null : s.OutLocation.Name))
        .ToListAsync();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<IList<ResponseDto>>.FromItemAndFluentValidation(
            specimens,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
