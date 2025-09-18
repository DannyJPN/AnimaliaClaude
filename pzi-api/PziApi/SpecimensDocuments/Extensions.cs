using PziApi.SpecimensDocuments.Endpoints;

namespace PziApi.SpecimensDocuments;

public static class Extensions
{
  public static void RegisterSpecimensDocumentsEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/DocumentSpecimens")
      .WithTags("DocumentSpecimens");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
  }
}
