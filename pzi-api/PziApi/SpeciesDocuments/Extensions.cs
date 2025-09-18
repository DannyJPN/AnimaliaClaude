using PziApi.SpeciesDocuments.Endpoints;

namespace PziApi.SpeciesDocuments;

public static class Extensions
{
  public static void RegisterDocumentSpeciesEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/DocumentSpecies")
      .WithTags("DocumentSpecies");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
  }
}