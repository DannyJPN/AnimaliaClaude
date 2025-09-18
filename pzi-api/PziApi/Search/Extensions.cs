using PziApi.Search.Endpoints;

namespace PziApi.Search;

public static class Extensions
{
  public static void RegisterPrintSearchEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/Search")
      .WithTags("Search");

    endpoints.MapPost("/SpeciesAutocomplete", SpeciesAutocomplete.Handle);
    endpoints.MapPost("/SpeciesSearch", SpeciesSearch.Handle);
    endpoints.MapPost("/PartnersAutocomplete", PartnersAutocomplete.Handle);
  }
}
