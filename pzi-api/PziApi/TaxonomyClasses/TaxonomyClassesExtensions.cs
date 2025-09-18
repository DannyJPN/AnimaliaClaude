using PziApi.TaxonomyClasses.Endpoints;

namespace PziApi.TaxonomyClasses;

public static class TaxonomyClassesExtensions
{
  public static void RegisterTaxonomyClassesEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/TaxonomyClasses")
      .WithTags("TaxonomyClasses");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle); 
    classEndpoints.MapDelete("/{id}", Delete.Handle);
    classEndpoints.MapPost("/Move", TaxonomyClassMove.Handle);
  }
}
