using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Search.Endpoints;

public static class SpeciesAutocomplete
{
  public record SpeciesAutocompleteResult(
      int Id,
      int TaxonomyGenusId,
      string? NameLat,
      string? NameCz
  );

  public class Request
  {
    public string SearchText { get; set; } = string.Empty;
    public bool SearchNameLat { get; set; } = true;
    public bool SearchNameCz { get; set; } = true;
    public string[]? ZooStatusCodes { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<IEnumerable<SpeciesAutocompleteResult>>>, BadRequest>> Handle(
      [FromBody] Request request, PziDbContext dbContext
  )
  {
    if (string.IsNullOrWhiteSpace(request.SearchText))
    {
      return TypedResults.BadRequest();
    }

    if (!request.SearchNameLat && !request.SearchNameCz)
    {
      return TypedResults.BadRequest();
    }

    var searchTerm = $"%{request.SearchText.ToLower()}%";

    var query = dbContext.Species
        .Where(s =>
            (request.SearchNameLat && EF.Functions.Like(s.NameLat!.ToLower(), searchTerm)) ||
            (request.SearchNameCz && EF.Functions.Like(s.NameCz!.ToLower(), searchTerm)));

    // Apply ZooStatus filter if provided
    if (request.ZooStatusCodes != null && request.ZooStatusCodes.Length > 0)
    {
      query = query.Where(s => request.ZooStatusCodes.Contains(s.ZooStatus));
    }

    var results = await query
        .OrderBy(s => request.SearchNameLat ? s.NameLat : s.NameCz)
        .Take(10)
        .Select(s => new SpeciesAutocompleteResult(
            s.Id,
            s.TaxonomyGenusId,
            s.NameLat,
            s.NameCz
        ))
        .ToListAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<IEnumerable<SpeciesAutocompleteResult>>.FromItem(results)
    );
  }
}
