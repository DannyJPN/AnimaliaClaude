using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class RegistrationExportByNumbers
{
  public record Request(string MinReg, string MaxReg);

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
        .Where(s => !string.IsNullOrEmpty(s.RegistrationNumber))
        .Where
            (s => (string.Compare(s.RegistrationNumber, request.MinReg) >= 0 && string.Compare(s.RegistrationNumber, request.MaxReg) < 0)
              || EF.Functions.Like(s.EuPermit, $"%{request.MinReg}%")
              || EF.Functions.Like(s.EuPermit, $"%{request.MaxReg}%"))
        .OrderBy(s => s.EuPermit)
        .ThenByDescending(s => s.Species!.ModifiedAt)
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
