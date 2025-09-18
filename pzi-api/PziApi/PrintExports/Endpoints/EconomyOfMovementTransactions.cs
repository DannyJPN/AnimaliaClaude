using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class EconomyMovementTransactions
{
  public record Request(string MinDate, string MaxDate);

  public class MovementInfoDto
  {
    public int AccessionNumber { get; set; }
    public string? SpeciesNameCz { get; set; }
    public string? SpeciesNameLat { get; set; }
    public string? ClassNameCz { get; set; }
    public string? ClassNameLat { get; set; }
    public string? Cryptogram { get; set; }
    public string? RegionName { get; set; }
    public decimal? Price { get; set; }
    public int Quantity { get; set; }
    public string? MovementDate { get; set; }
    public string? Password { get; set; }
    public string? MovementType { get; set; }
    public int TotalMovementCount { get; set; }
    public decimal TotalMovementPrice { get; set; }
    public int MovementTypeCount { get; set; }
    public decimal MovementTypePrice { get; set; }
    public int MovementOrder { get; set; }
  }

  public class MovementTypeStatsDto
  {
    public int Count { get; set; }
    public decimal Price { get; set; }
    public string Name { get; set; } = string.Empty;
  }

  public record ResponseDto(Dictionary<string, List<MovementInfoDto>> MovementsByType);

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

    var allowedIncrementReasonCodes = new[] { "IN03", "IN05", "IN08" };
    var allowedDecrementReasonCodes = new[] { "OUT03", "OUT05", "OUT12" };

    var taxonomyClasses = await dbContext.TaxonomyClasses.ToDictionaryAsync(tc => tc.Id);

    var movements = await dbContext.Movements
        .Include(m => m.Specimen)
            .ThenInclude(s => s!.TaxonomyHierarchyView)
        .Include(m => m.Specimen)
            .ThenInclude(s => s!.OrgHierarchyView)
        .Include(m => m.IncrementReason)
        .Include(m => m.DecrementReason)
        .Include(m => m.Partner)
        .Where(m =>
            m.Specimen != null &&
            m.Specimen.TaxonomyHierarchyView != null &&
            string.Compare(m.Date, minDate) >= 0 &&
            string.Compare(m.Date, maxDate) <= 0 &&
                (
                  (m.IncrementReasonCode != null && allowedIncrementReasonCodes.Contains(m.IncrementReasonCode)) ||
                  (m.DecrementReasonCode != null && allowedDecrementReasonCodes.Contains(m.DecrementReasonCode))
                )
              )
        .OrderBy(m => m.Date)
        .ThenBy(m => m.Specimen!.TaxonomyHierarchyView!.SpeciesNameCz)
        .ThenBy(m => m.Specimen!.TaxonomyHierarchyView!.SpeciesNameLat)
        .ThenBy(m => m.Specimen!.AccessionNumber)
        .ToListAsync();

    int totalMovementCount = movements.Sum(m => m.QuantityActual);
    decimal totalMovementPrice = movements.Sum(m =>
    {
      if (!m.Price.HasValue)
        return 0m;

      var direction = m.DecrementReasonCode != null ? -1m : 1m;
      return direction * m.Price.Value * m.QuantityActual;
    });

    var movementTypeStats = movements.Select(m => new
    {
      MovementTypeCode = m.IncrementReasonCode ?? m.DecrementReasonCode ?? "neznámý",
      MovementTypeName = m.IncrementReason?.DisplayName ?? m.DecrementReason?.DisplayName ?? "neznámý",
      Price = m.Price.HasValue
        ? (m.DecrementReasonCode != null ? -1 : 1) * m.Price.Value * m.QuantityActual
        : 0,
      Count = m.QuantityActual
    })
    .GroupBy(x => x.MovementTypeCode)
    .ToDictionary(
      g => g.Key,
      g => new MovementTypeStatsDto
      {
        Count = g.Sum(x => x.Count),
        Price = g.Sum(x => x.Price),
        Name = g.First().MovementTypeName
      });

    var incrementOrder = new Dictionary<string, int>
    {
      ["koupe"] = 0,
      ["deponace z"] = 1,
      ["dar"] = 2
    };

    var decrementOrder = new Dictionary<string, int>
    {
      ["prodej"] = 0,
      ["deponace do"] = 1,
      ["dar"] = 2
    };

    string NormalizeName(string name) =>
      name?.ToLowerInvariant()
          .Replace('ě', 'e')
          .Replace('š', 's')
          .Replace('č', 'c')
          .Replace('ř', 'r')
          .Replace('ž', 'z')
          .Replace('ý', 'y')
          .Replace('á', 'a')
          .Replace('í', 'i')
          .Replace('é', 'e') ?? "";

    var resultByType = movements
        .GroupBy(m => m.IncrementReasonCode ?? m.DecrementReasonCode ?? "neznámý")
        .OrderBy(g =>
        {
          var first = g.FirstOrDefault();
          if (first == null) return 9999;

          var key = first.IncrementReasonCode ?? first.DecrementReasonCode ?? "neznámý";
          var name = first.IncrementReason?.DisplayName ?? first.DecrementReason?.DisplayName ?? "neznámý";

          var normalizedName = NormalizeName(name);

          if (allowedIncrementReasonCodes.Contains(key) && incrementOrder.ContainsKey(normalizedName))
            return incrementOrder[normalizedName];

          if (allowedDecrementReasonCodes.Contains(key) && decrementOrder.ContainsKey(normalizedName))
            return 1000 + decrementOrder[normalizedName];

          return 2000;
        })
        .ToDictionary(
          g =>
          {
            var key = g.Key;
            var name = g.First().IncrementReason?.DisplayName ?? g.First().DecrementReason?.DisplayName ?? "neznámý";

            return name + (key == "IN08" ? " (přírůstek)"
                   : key == "OUT12" ? " (úbytek)"
                   : "");
          },
          g => g.Select(m =>
          {
            var s = m.Specimen;
            var taxonomyView = s?.TaxonomyHierarchyView;
            var orgView = s?.OrgHierarchyView;
            bool isIncrement = m.IncrementReasonCode != null;
            bool isDecrement = m.DecrementReasonCode != null;
            string movementType = isIncrement ? m.IncrementReason!.DisplayName : m.DecrementReason!.DisplayName;
            decimal? movementPrice = m.Price.HasValue
                ? (isDecrement ? -1 : 1) * m.Price.Value * m.QuantityActual
                : null;
            var key = m.IncrementReasonCode ?? m.DecrementReasonCode ?? "neznámý";
            var movementTypeData = movementTypeStats.ContainsKey(key)
                ? movementTypeStats[key]
                : new MovementTypeStatsDto { Count = 0, Price = 0m, Name = "" };

            return new MovementInfoDto
            {
              AccessionNumber = s?.AccessionNumber ?? 0,
              SpeciesNameCz = taxonomyView?.SpeciesNameCz,
              SpeciesNameLat = taxonomyView?.SpeciesNameLat,
              ClassNameLat = taxonomyView?.ClassNameLat,
              ClassNameCz = taxonomyView?.ClassNameCz,
              Cryptogram = taxonomyView?.IsVertebrate == true ? (taxonomyClasses.ContainsKey(taxonomyView.ClassId) ? taxonomyClasses[taxonomyView.ClassId].Cryptogram : null) : "BEZ",
              RegionName = orgView?.DistrictName,
              Price = movementPrice,
              Quantity = m.QuantityActual,
              MovementDate = m.Date,
              Password = m.Partner?.Keyword,
              MovementType = movementType,
              TotalMovementCount = totalMovementCount,
              TotalMovementPrice = totalMovementPrice,
              MovementTypeCount = movementTypeData.Count,
              MovementTypePrice = movementTypeData.Price,
              MovementOrder = movementTypeData.Count > 0 ? (allowedIncrementReasonCodes.Contains(key) ? 0 : 1000) : 9999
            };
          }).ToList()
        );

    return TypedResults.Ok(
        CommonDtos.SuccessResult<ResponseDto>.FromItem(new ResponseDto(resultByType))
    );
  }
}
