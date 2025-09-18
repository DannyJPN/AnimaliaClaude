using PziApi.TaxonomyFamilies.Endpoints;

namespace PziApi.TaxonomyFamilies;

public static class FamiliesExtensions
{
  public static void RegisterTaxonomyFamiliesEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/TaxonomyFamilies")
      .WithTags("TaxonomyFamilies");

    endpoints.MapPost("/{id}", Update.Handle);
    endpoints.MapPut("/", Insert.Handle);
    endpoints.MapDelete("/{id}", Delete.Handle);
    endpoints.MapPost("/Move", TaxonomyFamilyMove.Handle);
  }
}
