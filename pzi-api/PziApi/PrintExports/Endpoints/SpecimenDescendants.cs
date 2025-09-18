using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpecimenDescendants
{
  public record Request(int? SpecimenId);

  public class Child
  {
    public int Id { get; set; }
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? Zims { get; set; }
    public string? Name { get; set; }
    public string? BirthDate { get; set; }
    public string? BirthPlace { get; set; }
  }

  public class Partner
  {
    public int Id { get; set; }
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? Zims { get; set; }
    public string? Name { get; set; }
    public string? BirthDate { get; set; }
    public string? BirthPlace { get; set; }
  }

  public class Specimen
  {
    public int Id { get; set; }
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? Zims { get; set; }
    public string? Name { get; set; }
    public string? BirthDate { get; set; }
    public string? BirthPlace { get; set; }
  }

  public class DescendantsWithPartner
  {
    public required Partner? Partner { get; set; }
    public required IEnumerable<Child> Descendants { get; set; }
  }

  public class Response
  {
    public required Specimen Specimen { get; set; }

    public required IEnumerable<DescendantsWithPartner> DescendantsWithPartners { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<Response>>, NotFound, BadRequest<string>>> Handle(
      [FromBody] Request request, PziDbContext dbContext)
  {
    if (request.SpecimenId == null)
    {
      return TypedResults.NotFound();
    }

    var specimen = await dbContext.Specimens.FirstOrDefaultAsync(s => s.Id == request.SpecimenId);

    if (specimen == null)
    {
      return TypedResults.NotFound();
    }

    var mainSpecimen = new Specimen
    {
      Id = specimen.Id,
      AccessionNumber = specimen.AccessionNumber,
      GenderTypeCode = specimen.GenderTypeCode,
      Zims = specimen.Zims,
      Name = specimen.Name,
      BirthDate = specimen.BirthDate,
      BirthPlace = specimen.BirthPlace
    };

    var isMale = specimen.GenderTypeCode!.StartsWith('M');
    var isFemale = specimen.GenderTypeCode!.StartsWith('F');

    if (!isMale && !isFemale)
    {
      return TypedResults.Ok(
        CommonDtos.SuccessResult<Response>.FromItemAndFluentValidation(
            new Response
            {
              Specimen = mainSpecimen,
              DescendantsWithPartners = []
            },
            new FluentValidation.Results.ValidationResult()
        )
      );
    }

    var descendantsQuery = isMale
        ? dbContext.Specimens.Where(s => s.FatherId == specimen.Id)
              .Select(s => new
              {
                s.Id,
                s.AccessionNumber,
                s.GenderTypeCode,
                s.Zims,
                s.Name,
                s.BirthDate,
                s.BirthPlace,
                s.FatherId,
                s.MotherId,
                OtherParent = s.Mother
              })
        : dbContext.Specimens.Where(s => s.MotherId == specimen.Id)
              .Select(s => new
              {
                s.Id,
                s.AccessionNumber,
                s.GenderTypeCode,
                s.Zims,
                s.Name,
                s.BirthDate,
                s.BirthPlace,
                s.FatherId,
                s.MotherId,
                OtherParent = s.Father
              });

    var descendantsData = await descendantsQuery.ToArrayAsync();

    var descendantsWithPartners = descendantsData
        .GroupBy(d => d.OtherParent?.Id)
        .OrderBy(g => g.Key)
        .Select(g =>
        {
          var descendants = g
                .OrderBy(d => d.AccessionNumber)
                .ToArray();

          Partner? partner = null;

          if (descendants.First().OtherParent != null)
          {
            var otherParent = descendants.First().OtherParent!;

            partner = new Partner
            {
              Id = otherParent.Id,
              AccessionNumber = otherParent.AccessionNumber,
              GenderTypeCode = otherParent.GenderTypeCode,
              Zims = otherParent.Zims,
              Name = otherParent.Name,
              BirthDate = otherParent.BirthDate,
              BirthPlace = otherParent.BirthPlace
            };
          }

          var children = descendants
                .Select(d => new Child
                {
                  Id = d.Id,
                  AccessionNumber = d.AccessionNumber,
                  GenderTypeCode = d.GenderTypeCode,
                  Zims = d.Zims,
                  Name = d.Name,
                  BirthDate = d.BirthDate,
                  BirthPlace = d.BirthPlace
                })
                .ToArray();

          return new DescendantsWithPartner
          {
            Partner = partner,
            Descendants = children
          };
        })
        .ToArray();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<Response>.FromItemAndFluentValidation(
            new Response
            {
              Specimen = mainSpecimen,
              DescendantsWithPartners = descendantsWithPartners
            },
            new FluentValidation.Results.ValidationResult()
        )
      );
  }
}