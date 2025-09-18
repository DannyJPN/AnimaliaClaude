using PziApi.TaxonomyPhyla.Endpoints;

namespace PziApi.TaxonomyPhyla;

public static class TaxonomyPhylaExtensions
{
  public static void RegisterTaxonomyPhylaEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/TaxonomyPhyla")
      .WithTags("TaxonomyPhyla");

    endpoints.MapPost("/{id}", Update.Handle);
    endpoints.MapPut("/", Insert.Handle);
    endpoints.MapDelete("/{id}", Delete.Handle);
  }
}