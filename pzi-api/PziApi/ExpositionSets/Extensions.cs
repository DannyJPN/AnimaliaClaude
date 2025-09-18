using PziApi.ExpositionSets.Endpoints;

namespace PziApi.ExpositionSets;

public static class Extensions
{
  public static void RegisterExpositionSetsEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/ExpositionSets")
        .WithTags("ExpositionSets");

    group.MapPut("/", Insert.Handle);
    group.MapPost("/{id}", Update.Handle);
    group.MapDelete("/{id}", Delete.Handle);
    group.MapPost("/move", ExpositionSetMove.Handle);
  }
}
