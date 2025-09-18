using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PziApi.PrintExports.Endpoints;

public class ProtectedAndEuFaunaSpeciesList
{
  public class Request
  {
    [Required]
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public InZooFilterEnum ProtectionType { get; set; }
  }

  public class SpeciesInfoDto
  {
    public string? NameLat { get; set; }
    public string? NameCz { get; set; }
    public string? ProtectionRefNumber { get; set; }
  }

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.ProtectionType)
          .IsInEnum()
          .WithMessage("Typ ochrany je povinný parametr.");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesInfoDto[]>>, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    var validator = new RequestValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var query = dbContext.Species.Where(s => s.QuantityInZoo > 0);
    string refNumberFieldName;

    switch (request.ProtectionType)
    {
      case InZooFilterEnum.Eufauna:
        query = query.Where(s => s.IsEuFauna && string.IsNullOrEmpty(s.ProtectionTypeCode)); // CROchrana = ProtectionTypeCode
        refNumberFieldName = "EuFaunaRefNumber";
        break;

      case InZooFilterEnum.CrProtection:
        query = query.Where(s => !string.IsNullOrEmpty(s.ProtectionTypeCode)); // CROchrana = ProtectionTypeCode
        refNumberFieldName = "CrExceptionRefNumber";
        break;
      default:
        return TypedResults.ValidationProblem(
            new Dictionary<string, string[]>
            {
                { "ProtectionType", ["Neplatný typ ochrany. Povolené hodnoty jsou 'Eufauna' nebo 'CrProtection'."] }
            }
        );
    }

    var speciesWithSpecimensInZoo = await query
        .OrderBy(s => s.NameLat)
        .Select(s => new SpeciesInfoDto
        {
          NameLat = s.NameLat,
          NameCz = s.NameCz,
          ProtectionRefNumber = refNumberFieldName == "EuFaunaRefNumber" ? s.EuFaunaRefNumber : s.CrExceptionRefNumber
        })
        .ToListAsync();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpeciesInfoDto[]>.FromItemAndFluentValidation(
            speciesWithSpecimensInZoo.ToArray(),
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
