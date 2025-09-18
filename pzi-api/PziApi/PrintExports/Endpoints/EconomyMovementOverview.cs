using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class EconomyMovementOverview
{
  public record Request(string MinDate, string MaxDate);

  public class MovementTypeDto
  {
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public MovementInfoDto[] Movements { get; set; } = [];
  }

  public class MovementInfoDto
  {
    public int Quantity { get; set; }
    public string? SpeciesNameCz { get; set; }
    public int? AccessionNumber { get; set; }
    public string? MovementDate { get; set; }
    public string? Cryptogram { get; set; }
    public decimal Price { get; set; }
    public string? Keyword { get; set; }
  }

  public record ResponseDto(IEnumerable<MovementTypeDto> MovementsByType);

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

  private static string GetMovementTypeLabel(string? name, bool isIncrement, bool isDecrement, HashSet<string> duplicateNames)
  {
    if (string.IsNullOrEmpty(name))
      return "neznámý";

    if (duplicateNames.Contains(name))
    {
      var directionLabel = isIncrement ? "přírůstek" : isDecrement ? "úbytek" : null;
      return directionLabel != null ? $"{name} ({directionLabel})" : name;
    }

    return name;
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<ResponseDto>>, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
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

#pragma warning disable CS8602

    var relevantMovementsData = await dbContext.Movements
          .Where(m =>
            m.AccountingDate != null &&
            string.Compare(m.AccountingDate, minDate) >= 0 &&
            string.Compare(m.AccountingDate, maxDate) <= 0)
          .Select(m => new
          {
            Id = m.Id,
            Date = m.Date,
            AccountingDate = m.AccountingDate,
            IncrementReasonCode = m.IncrementReasonCode,
            IncrementReasonName = m.IncrementReason.DisplayName,
            DecrementReasonCode = m.DecrementReasonCode,
            DecrementReasonName = m.DecrementReason.DisplayName,
            QuantityActual = m.QuantityActual,
            Price = m.Price,
            AccessionNumber = m.Specimen.AccessionNumber,
            PartnerKeyword = m.Partner.Keyword,
            SpeciesId = m.Specimen.SpeciesId,
            SpeciesNameCz = m.Specimen.Species.NameCz,
            SpeciesNameLat = m.Specimen.Species.NameLat,
            Cryptogram = m.Specimen.Species.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass.Cryptogram,
            IsVertebrate = m.Specimen.Species.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass.TaxonomyPhylum.IsVertebrate,
          })
          .ToArrayAsync();

#pragma warning restore CS8602

    var increments = relevantMovementsData
          .Where(m => !string.IsNullOrEmpty(m.IncrementReasonCode))
          .GroupBy(m => m.IncrementReasonCode)
          .OrderBy(g => g.Key)
          .Select(g =>
          {
            var first = g.First();

            var movements = g.OrderBy(m => m.Date)
                  .ThenBy(m => m.SpeciesNameCz).ThenBy(m => m.AccessionNumber)
                  .Select(m => new MovementInfoDto
                  {
                    AccessionNumber = m.AccessionNumber,
                    Cryptogram = m.IsVertebrate ? m.Cryptogram : "BEZ",
                    MovementDate = m.Date,
                    Keyword = m.PartnerKeyword,
                    Price = (m.Price ?? 0m) * m.QuantityActual,
                    Quantity = m.QuantityActual,
                    SpeciesNameCz = m.SpeciesNameCz
                  })
                  .ToArray();

            return new MovementTypeDto
            {
              Code = first.IncrementReasonCode!,
              Name = first.IncrementReasonName,
              Movements = movements
            };
          })
          .ToArray();

    var decrements = relevantMovementsData
          .Where(m => !string.IsNullOrEmpty(m.DecrementReasonCode))
          .GroupBy(m => m.DecrementReasonCode)
          .OrderBy(g => g.Key)
          .Select(g =>
          {
            var first = g.First();

            var movements = g.OrderBy(m => m.Date)
                  .ThenBy(m => m.SpeciesNameCz).ThenBy(m => m.AccessionNumber)
                  .Select(m => new MovementInfoDto
                  {
                    AccessionNumber = m.AccessionNumber,
                    Cryptogram = m.IsVertebrate ? m.Cryptogram : "BEZ",
                    MovementDate = m.Date,
                    Keyword = m.PartnerKeyword,
                    Price = (m.Price ?? 0m) * -1 * m.QuantityActual,
                    Quantity = m.QuantityActual,
                    SpeciesNameCz = m.SpeciesNameCz
                  })
                  .ToArray();

            return new MovementTypeDto
            {
              Code = first.DecrementReasonCode!,
              Name = first.DecrementReasonName,
              Movements = movements
            };
          })
          .ToArray();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<ResponseDto>.FromItem(
        new ResponseDto(increments.Concat(decrements))
      )
    );
  }
}
