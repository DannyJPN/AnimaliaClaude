using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class InventoryMovements
{
  public record Request(string MinDate, string MaxDate, string StateInfluence);

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.MinDate)
          .NotEmpty()
          .Must(DateTimeHelpers.IsValidDateStringInput)
          .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
          .WithMessage("MinDate is not a valid date.");

      RuleFor(x => x.MaxDate)
          .NotEmpty()
          .Must(DateTimeHelpers.IsValidDateStringInput)
          .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
          .WithMessage("MaxDate is not a valid date.");
    }
  }

  public class MovementDto
  {
    public int SpecimenId { get; set; }
    public string Date { get; set; } = null!;
    public int? LocationId { get; set; }
    public string? LocationName { get; set; }
    public string? IncrementReason { get; set; }
    public string? DecrementReason { get; set; }
    public string? ContractNumber { get; set; }
    public string? Note { get; set; }
    public int? AccessionNumber { get; set; }
    public string? Gender { get; set; }
    public string? SpeciesNameLat { get; set; }
    public string? SpeciesNameCz { get; set; }
    public string? Keyword { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<List<MovementDto>>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    var validator = new RequestValidator();
    var validationResult = await validator.ValidateAsync(request);
    if (!validationResult.IsValid)
    {
      return TypedResults.BadRequest(CommonDtos.ValidationErrors.FromFluentValidation(validationResult));
    }

    Enum.TryParse<StateInfluenceEnum>(request.StateInfluence, true, out var stateInfluenceEnum);

    var query = dbContext.Movements.AsQueryable();
    if (stateInfluenceEnum == StateInfluenceEnum.WithInfluence)
    {
      query = query.Where(m => m.Quantity > 0);
    }
    else if (stateInfluenceEnum == StateInfluenceEnum.WithoutInfluence)
    {
      query = query.Where(m => m.Quantity == 0);
    }

    var minYear = request.MinDate.Split('/')[0];
    var maxYear = request.MaxDate.Split('/')[0];

    query = query.Where(m =>
        m.Date != null && m.Date.Length >= 4 &&
        string.Compare(m.Date.Substring(0, 4), minYear) >= 0 &&
        string.Compare(m.Date.Substring(0, 4), maxYear) <= 0);

    var movementsFromDb = await query
        .Select(m => new MovementDto
        {
          SpecimenId = m.SpecimenId,
          Date = m.Date,
          LocationId = m.LocationId,
          LocationName = m.Partner != null ? m.Partner.Name : "",
          IncrementReason = m.IncrementReason != null ? m.IncrementReason.DisplayName : null,
          DecrementReason = m.DecrementReason != null ? m.DecrementReason.DisplayName : null,
          ContractNumber = m.Contract != null ? m.Contract.Number : null,
          Note = m.Note,
          AccessionNumber = m.Specimen != null ? m.Specimen.AccessionNumber : null,
          Gender = m.Specimen != null ? m.Specimen.GenderTypeCode : null,
          SpeciesNameLat = m.Specimen != null && m.Specimen.Species != null ? m.Specimen.Species.NameLat : null,
          SpeciesNameCz = m.Specimen != null && m.Specimen.Species != null ? m.Specimen.Species.NameCz : null,
          Keyword = m.Partner != null ? m.Partner.Keyword : null
        })
        .ToListAsync();

    var movements = movementsFromDb
        .Where(m =>
            string.Compare(m.Date, request.MinDate, StringComparison.Ordinal) >= 0 &&
            string.Compare(m.Date, request.MaxDate, StringComparison.Ordinal) <= 0
        )
        .OrderBy(m => m.Date, StringComparer.Ordinal)
        .ThenBy(m => m.AccessionNumber)
        .ThenBy(m => m.ContractNumber)
        .ThenBy(m => m.LocationName)
        .ThenBy(m => m.IncrementReason)
        .ToList();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<List<MovementDto>>.FromItemAndFluentValidation(
            movements,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
