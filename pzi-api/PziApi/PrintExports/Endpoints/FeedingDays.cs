using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class FeedingDays
{
  public record Request(int SpeciesId, string MinDate, string MaxDate);

  public record ResponseDto(int Id, string? NameCz, string? NameLat, IList<SpecimenInfoDto> Specimens);

  public record SpecimenInfoDto(
    int Id,
    int? AccessionNumber,
    string? GenderTypeCode,
    string? Zims,
    int FeedingDays,
    string? LastIncrementReason,
    string? LastDecrementReason,
    string? LastMovementDate,
    string? StudBookNumber,
    string? StudBookName);

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.SpeciesId).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY).WithMessage("SpeciesId is required.");
      RuleFor(x => x.MinDate)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("MinDate is not valid date (yyyy/MM/dd).");

      RuleFor(x => x.MinDate)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("MaxDate is not valid date (yyyy/MM/dd).");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<ResponseDto>>, NotFound, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext)
  {
    // NOTE: It is possible to input date in format yyyy in the legacy, however calculation is not working, so it is useless. We will support only full date.
    var validator = new RequestValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var species = await dbContext.Species
        .Where(s => s.Id == request.SpeciesId)
        .Select(s => new ResponseDto(s.Id, s.NameCz, s.NameLat, new List<SpecimenInfoDto>()))
        .SingleOrDefaultAsync();

    if (species == null)
    {
      return TypedResults.NotFound();
    }

    var allSpecimens = await dbContext.Specimens
        .Where(sp => sp.SpeciesId == species.Id)
        .OrderBy(sp => sp.AccessionNumber)
        .Select(sp => new
        {
          Id = sp.Id,
          AccessionNumber = sp.AccessionNumber,
          GenderTypeCode = sp.GenderTypeCode,
          Zims = sp.Zims,
          StudBookNumber = sp.StudBookNumber,
          StudBookName = sp.StudBookName,
          InDate = sp.InDate,
          OutDate = sp.OutDate
        })
        .ToListAsync();

    var specimens = allSpecimens
        .Where(sp =>
            // InDate <= MaxDate
            sp.InDate != null && string.Compare(sp.InDate, request.MaxDate) <= 0 &&
            // OutDate == null || OutDate >= MinDate
            (string.IsNullOrEmpty(sp.OutDate) || string.Compare(sp.OutDate, request.MinDate) >= 0)
        )
        .ToList();

    var specimenIds = specimens.Select(sp => sp.Id).ToList();

    var movementsDictionary = await dbContext.Movements
      .Include(m => m.IncrementReason)
      .Include(m => m.DecrementReason)
      .Where(m => specimenIds.Contains(m.SpecimenId))
      .Where(m => string.Compare(m.Date, request.MaxDate) <= 0)
      .GroupBy(m => m.SpecimenId)
      .ToDictionaryAsync(m => m.Key, m => m.ToList());

    foreach (var specimen in specimens)
    {
      var feedingDaysResult = CalculateFeedingDays(specimen.Id, request.MinDate, request.MaxDate, movementsDictionary);
      if (feedingDaysResult != null && feedingDaysResult.FeedingDays > 0)
      {
        var specimenDto = new SpecimenInfoDto(
          Id: specimen.Id,
          AccessionNumber: specimen.AccessionNumber,
          GenderTypeCode: specimen.GenderTypeCode,
          Zims: specimen.Zims,
          StudBookNumber: specimen.StudBookNumber,
          StudBookName: specimen.StudBookName,
          FeedingDays: feedingDaysResult.FeedingDays,
          LastIncrementReason: feedingDaysResult.LastIncrementReason,
          LastDecrementReason: feedingDaysResult.LastDecrementReason,
          LastMovementDate: feedingDaysResult.LastMovementDate);

        species.Specimens.Add(specimenDto);
      }
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<ResponseDto>.FromItemAndFluentValidation(
            species,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }

  private class FeedingDaysResult
  {
    public int FeedingDays { get; set; }
    public string? LastIncrementReason { get; set; }
    public string? LastDecrementReason { get; set; }
    public string? LastMovementDate { get; set; }
  }

  private static FeedingDaysResult CalculateFeedingDays(
    int specimenId, string minDate, string maxDate, Dictionary<int, List<Models.Movement>> movementsDictionary)
  {
    var result = new FeedingDaysResult
    {
      FeedingDays = 0
    };

    int totalDays = DateTimeHelpers.CalculateDaysDifference(minDate, maxDate) + 1;

    var movements = movementsDictionary[specimenId];
    if (movements.Count == 0)
    {
      return result;
    }

    int feedingDays = 0;
    string? lastIncrementReason = null;
    string? lastDecrementReason = null;
    string? lastMovementDate = null;

    foreach (var movement in movements)
    {
      string movementDate = DateTimeHelpers.ExtractDateString(movement.Date);

      int diff;

      if (string.Compare(movementDate, minDate) < 0)
      {
        diff = totalDays;
      }
      else
      {
        diff = DateTimeHelpers.CalculateDaysDifference(movementDate, maxDate) + 1;
      }

      if (!string.IsNullOrEmpty(movement.IncrementReasonCode))
      {
        feedingDays += diff * movement.Quantity;
        lastIncrementReason = movement.IncrementReason?.DisplayName;
        lastDecrementReason = null;
        lastMovementDate = movement.Date;
      }
      else if (!string.IsNullOrEmpty(movement.DecrementReasonCode))
      {
        feedingDays -= diff * movement.Quantity;
        lastDecrementReason = movement.DecrementReason?.DisplayName;
        lastIncrementReason = null;
        lastMovementDate = movement.Date;
      }
    }

    result.FeedingDays = feedingDays;
    result.LastIncrementReason = lastIncrementReason;
    result.LastDecrementReason = lastDecrementReason;
    result.LastMovementDate = lastMovementDate;

    return result;
  }
}
