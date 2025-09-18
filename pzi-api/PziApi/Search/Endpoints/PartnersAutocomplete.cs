using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Search.Endpoints;

public static class PartnersAutocomplete
{
  public record PartnerAutocompleteResult(
      int Id,
      string Keyword
  );

  public class Request
  {
    public string SearchText { get; set; } = string.Empty;
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<IEnumerable<PartnerAutocompleteResult>>>, BadRequest>> Handle(
      [FromBody] Request request, PziDbContext dbContext
  )
  {
    if (string.IsNullOrWhiteSpace(request.SearchText))
    {
      return TypedResults.BadRequest();
    }

    var searchTerm = $"%{request.SearchText.ToLower()}%";

    var query = dbContext.Partners
        .Where(p => EF.Functions.Like(p.Keyword.ToLower(), searchTerm));

    var results = await query
        .OrderBy(p => p.Keyword)
        .Take(10)
        .Select(p => new PartnerAutocompleteResult(
            p.Id,
            p.Keyword
        ))
        .ToListAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<IEnumerable<PartnerAutocompleteResult>>.FromItem(results)
    );
  }
}
