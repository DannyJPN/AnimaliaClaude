using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class EconomyMovementRecap
{
  public record Request(string MinDate, string MaxDate);

  public class MovementSummaryItemDto
  {
    public string MovementType { get; set; } = default!;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
  }

  public class MovementSummarySectionDto
  {
    public List<MovementSummaryItemDto> Items { get; set; } = new();
    public int TotalQuantity { get; set; }
    public decimal TotalPrice { get; set; }
  }

  public class MovementSummaryDto
  {
    public MovementSummarySectionDto Increments { get; set; } = new();
    public MovementSummarySectionDto Decrements { get; set; } = new();

    public MovementSummaryItemDto Difference => new()
    {
      MovementType = "Rozdíl",
      Quantity = Increments.TotalQuantity - Decrements.TotalQuantity,
      Price = Increments.TotalPrice - Decrements.TotalPrice
    };
  }

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.MinDate)
          .NotEmpty()
          .Must(DateTimeHelpers.IsValidFullDateString)
          .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
          .WithMessage("MinDate is not valid date (yyyy/MM/dd).");

      RuleFor(x => x.MaxDate)
          .NotEmpty()
          .Must(DateTimeHelpers.IsValidFullDateString)
          .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
          .WithMessage("MaxDate is not valid date (yyyy/MM/dd).");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<MovementSummaryDto>>, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
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

    var minDate = request.MinDate;
    var maxDate = request.MaxDate;

    var incrementSorts = await dbContext.IncrementReasons.ToDictionaryAsync(r => r.DisplayName, r => r.Sort);
    var decrementSorts = await dbContext.DecrementReasons.ToDictionaryAsync(r => r.DisplayName, r => r.Sort);

    var movements = await dbContext.Movements
        .Include(m => m.IncrementReason)
        .Include(m => m.DecrementReason)
        .Where(m =>
            m.AccountingDate != null &&
            string.Compare(m.AccountingDate, minDate) >= 0 &&
            string.Compare(m.AccountingDate, maxDate) <= 0)
        .ToListAsync();

    var incrementGroups = movements
        .Where(m => m.IncrementReasonCode != null)
        .GroupBy(m => m.IncrementReason!.DisplayName)
        .Select(g => new
        {
          Sort = incrementSorts.TryGetValue(g.Key, out var s) ? s : 999,
          Item = new MovementSummaryItemDto
          {
            MovementType = g.Key,
            Quantity = g.Sum(x => x.QuantityActual),
            Price = g.Sum(x => (x.Price ?? 0m) * x.QuantityActual)
          }
        })
        .OrderBy(x => x.Sort)
        .Select(x => x.Item)
        .ToList();

    var decrementGroups = movements
        .Where(m => m.DecrementReasonCode != null)
        .GroupBy(m => m.DecrementReason!.DisplayName)
        .Select(g => new
        {
          Sort = decrementSorts.TryGetValue(g.Key, out var s) ? s : 999,
          Item = new MovementSummaryItemDto
          {
            MovementType = g.Key,
            Quantity = g.Sum(x => x.QuantityActual),
            Price = g.Sum(x => (x.Price ?? 0m) * x.QuantityActual)
          }
        })
        .OrderBy(x => x.Sort)
        .Select(x => x.Item)
        .ToList();

    var dto = new MovementSummaryDto
    {
      Increments = new MovementSummarySectionDto
      {
        Items = incrementGroups,
        TotalQuantity = incrementGroups.Sum(x => x.Quantity),
        TotalPrice = incrementGroups.Sum(x => x.Price)
      },
      Decrements = new MovementSummarySectionDto
      {
        Items = decrementGroups,
        TotalQuantity = decrementGroups.Sum(x => x.Quantity),
        TotalPrice = decrementGroups.Sum(x => x.Price)
      }
    };

    return TypedResults.Ok(CommonDtos.SuccessResult<MovementSummaryDto>.FromItem(dto));
  }
}
