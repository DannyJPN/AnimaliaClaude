using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class SpecimenGenealogyTree
{
  public record Request(int? SpecimenId);

  public class Specimen
  {
    public int Id { get; set; }
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? Zims { get; set; }
    public string? Name { get; set; }
    public string? BirthDate { get; set; }
    public string? BirthPlace { get; set; }
    public int? FatherId { get; set; }
    public int? MotherId { get; set; }
    public bool AlreadyIncluded { get; set; }
    public Specimen? Father { get; set; }
    public Specimen? Mother { get; set; }
  }

  private static Specimen MapSpecimenGenealogy(Models.Specimen originalSpecimen, List<int> seenIds)
  {
    var alreadyIncluded = seenIds.Contains(originalSpecimen.Id);

    var specimen = new Specimen
    {
      Id = originalSpecimen.Id,
      AccessionNumber = originalSpecimen.AccessionNumber,
      GenderTypeCode = originalSpecimen.GenderTypeCode,
      Zims = originalSpecimen.Zims,
      Name = originalSpecimen.Name,
      BirthDate = originalSpecimen.BirthDate,
      BirthPlace = originalSpecimen.BirthPlace,
      FatherId = originalSpecimen.FatherId,
      MotherId = originalSpecimen.MotherId,
      AlreadyIncluded = alreadyIncluded
    };

    if (!alreadyIncluded)
    {
      seenIds.Add(originalSpecimen.Id);

      if (originalSpecimen.Father != null)
      {
        var father = MapSpecimenGenealogy(originalSpecimen.Father, seenIds);

        specimen.Father = father;
      }

      if (originalSpecimen.Mother != null)
      {
        var mother = MapSpecimenGenealogy(originalSpecimen.Mother, seenIds);

        specimen.Mother = mother;
      }
    }

    return specimen;
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<Specimen>>, NotFound, BadRequest<string>>> Handle(
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

    var loadedIds = new List<int>();
    var specimensToLoad = new Stack<Models.Specimen>();

    specimensToLoad.Push(specimen);
    loadedIds.Add(specimen.Id);

    while (specimensToLoad.Count != 0)
    {
      var specimenToLoad = specimensToLoad.Pop();

      if (specimenToLoad.FatherId != null)
      {
        await dbContext.Entry(specimenToLoad).Reference(s => s.Father).LoadAsync();

        if (!loadedIds.Contains(specimenToLoad.FatherId.Value))
        {
          specimensToLoad.Push(specimenToLoad.Father!);
        }
      }

      if (specimenToLoad.MotherId != null)
      {
        await dbContext.Entry(specimenToLoad).Reference(s => s.Mother).LoadAsync();

        if (!loadedIds.Contains(specimenToLoad.MotherId.Value))
        {
          specimensToLoad.Push(specimenToLoad.Mother!);
        }
      }
    }

    var specimenResult = MapSpecimenGenealogy(specimen, new List<int>());

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Specimen>.FromItemAndFluentValidation(
        specimenResult,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}