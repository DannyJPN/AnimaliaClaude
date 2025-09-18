using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class StatisticBirths
{
  public record Request(string MinDate, string MaxDate);

  public class ClassStatisticDto
  {
    public string? NameCz { get; set; }
    public int SpecimenCount { get; set; }
    public int SpeciesCount { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<ClassStatisticDto[]>>, BadRequest<string>>> Handle(
      Request request,
      PziDbContext dbContext)
  {
    if (string.IsNullOrEmpty(request.MinDate) || string.IsNullOrEmpty(request.MaxDate))
    {
      return TypedResults.BadRequest("Both minDate and maxDate must be provided");
    }

    var minDateM1 = DateTime.Parse(request.MinDate).AddDays(-1).ToString("yyyy/MM/dd");
    var maxDateP1 = DateTime.Parse(request.MaxDate).AddDays(1).ToString("yyyy/MM/dd");

    var aggregateData = await dbContext.Movements
          .Where(m => m.IncrementReasonCode == "IN01")
          .Where(m => string.Compare(m.Date, minDateM1) > 0 && string.Compare(m.Date, maxDateP1) < 0)
          .Select(m => new
          {
            m.Quantity,
            m.Specimen!.SpeciesId,
            m.Specimen!.TaxonomyHierarchyView!.ClassId
          })
          .GroupBy(m => m.ClassId)
          .Select(g => new
          {
            ClassId = g.Key,
            SpeciesQuantity = g.Select(e => e.SpeciesId).Distinct().Count(),
            SpecimenCount = g.Sum(e => e.Quantity)
          })
          .Join(
            dbContext.TaxonomyClasses,
            e => e.ClassId,
            e => e.Id,
            (x, y) => new
            {
              x.ClassId,
              x.SpeciesQuantity,
              x.SpecimenCount,
              y.NameCz,
              y.Code
            }
          )
          .OrderBy(e => e.Code)
          .ToArrayAsync();

    var result = aggregateData.Select(ad => new ClassStatisticDto()
    {
      NameCz = ad.NameCz,
      SpeciesCount = ad.SpeciesQuantity,
      SpecimenCount = ad.SpecimenCount
    }).ToArray();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<ClassStatisticDto[]>.FromItemAndFluentValidation(
          result,
          new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
