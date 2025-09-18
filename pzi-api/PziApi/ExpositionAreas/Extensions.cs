using PziApi.ExpositionAreas.Endpoints;

namespace PziApi.ExpositionAreas;

public static class Extensions
{
  public static void RegisterExpositionAreasEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/ExpositionAreas")
        .WithTags("ExpositionAreas");

    group.MapPut("/", Insert.Handle);
    group.MapPost("/{id}", Update.Handle);
    group.MapDelete("/{id}", Delete.Handle);
  }
}
