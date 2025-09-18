using PziApi.TaxonomyGenera.Endpoints;

namespace PziApi.TaxonomyGenera;

public static class GeneraExtensions
{
  public static void RegisterTaxonomyGeneraEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/TaxonomyGenera")
      .WithTags("TaxonomyGenera");

    endpoints.MapPost("/{id}", Update.Handle);
    endpoints.MapPut("/", Insert.Handle);
    endpoints.MapDelete("/{id}", Delete.Handle);
    endpoints.MapPost("/Move", TaxonomyGenusMove.Handle);
  }
}
