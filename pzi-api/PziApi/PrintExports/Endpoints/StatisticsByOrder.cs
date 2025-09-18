using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class StatisticsByOrder
{
  public record Request(string Date);

  public class TaxonomyOrderDto
  {
    public string? Name { get; set; }
    public string? LatinName { get; set; }
    public decimal MaleCount { get; set; } = 0;
    public decimal FemaleCount { get; set; } = 0;
    public decimal UnknownCount { get; set; } = 0;
    public decimal SpeciesCount { get; set; } = 0;
  }

  public class TaxonomyClassDto
  {
    public string? Name { get; set; }
    public string? LatinName { get; set; }
    public List<TaxonomyOrderDto> Orders { get; set; } = new List<TaxonomyOrderDto>();
  }

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.Date)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("MinDate is not valid date (yyyy/MM/dd).");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<TaxonomyClassDto[]>>, NotFound, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
      Request request,
      PziDbContext dbContext)
  {
    var validator = new RequestValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var specimensDataOnDate = await StateOnDateCalculation.CalculateSpecimensStateOnDate(dbContext, request.Date, (quantity, _) => quantity.QuantityInZoo > 0);

    var specimenStateOnDateCache = specimensDataOnDate.acceptedSpecimensCache;

    // NOTE: Original code worked on vertebrate only, so we need to add filter by that
    var vertebrateOrdersData = await dbContext.TaxonomyOrders
          .Where(to => to.TaxonomyClass!.TaxonomyPhylum!.IsVertebrate)
          .Select(to => new
          {
            to.Id,
            to.NameCz,
            to.NameLat,
            to.Code,
            ClassId = to.TaxonomyClassId,
            ClassCode = to.TaxonomyClass!.Code,
            ClassNameCz = to.TaxonomyClass!.NameCz,
            ClassNameLat = to.TaxonomyClass!.NameLat
          })
          .ToArrayAsync();

    var applicableOrderIds = vertebrateOrdersData.Select(o => o.Id).ToArray();

    var specimenDataWithOrderIds = await dbContext.Specimens
          .Where(s => specimensDataOnDate.acceptedSpecimenIds.Contains(s.Id)
              && applicableOrderIds.Contains(s.TaxonomyHierarchyView!.OrderId))
          .Select(s => new
          {
            s.Id,
            s.GenderTypeCode,
            s.TaxonomyHierarchyView!.SpeciesId,
            s.TaxonomyHierarchyView!.OrderId
          })
          .ToArrayAsync();

    var specimenDataByOrderId = specimenDataWithOrderIds
          .GroupBy(s => s.OrderId)
          .ToDictionary(
            g => g.Key,
            g => g.ToArray()
          );

    var ordersByClass = vertebrateOrdersData
            .GroupBy(o => o.ClassId)
            .Select(g =>
            {
              return new
              {
                ClassId = g.Key,
                ClassCode = g.First().ClassCode,
                ClassNameCz = g.First().ClassNameCz,
                ClassNameLat = g.First().ClassNameLat,
                Orders = g.ToArray()
              };
            })
            .OrderBy(c => c.ClassCode)
            .ToArray();

    var result = ordersByClass.Select(c =>
    {
      var orders = c.Orders
            .Where(o => specimenDataByOrderId.ContainsKey(o.Id))
            .OrderBy(o => o.Code)
            .Select(o =>
            {
              var applicableSpecimenData = specimenDataByOrderId[o.Id]
                    .Where(s => specimenStateOnDateCache[s.Id].Quantities.QuantityInZoo > 0)
                    .ToArray();

              var maleCount = applicableSpecimenData
                    .Where(s => s.GenderTypeCode![0] == 'M')
                    .Sum(s => specimenStateOnDateCache[s.Id].Quantities.QuantityInZoo);

              var femaleCount = applicableSpecimenData
                    .Where(s => s.GenderTypeCode![0] =='F')
                    .Sum(s => specimenStateOnDateCache[s.Id].Quantities.QuantityInZoo);

              var unknownCount = applicableSpecimenData
                    .Where(s => s.GenderTypeCode![0] == 'U')
                    .Sum(s => specimenStateOnDateCache[s.Id].Quantities.QuantityInZoo);

              var speciesCount = applicableSpecimenData
                    .Select(s => s.SpeciesId)
                    .Distinct()
                    .Count();

              return new TaxonomyOrderDto
              {
                Name = o.NameCz,
                LatinName = o.NameLat,
                MaleCount = maleCount,
                FemaleCount = femaleCount,
                UnknownCount = unknownCount,
                SpeciesCount = speciesCount
              };
            })
            .ToList();

      return new TaxonomyClassDto
      {
        Name = c.ClassNameCz,
        LatinName = c.ClassNameLat,
        Orders = orders
      };
    })
    .Where(c => c.Orders.Count > 0)
    .ToArray();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<TaxonomyClassDto[]>.FromItemAndFluentValidation(
            result,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
