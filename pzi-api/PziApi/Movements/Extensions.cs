using PziApi.Movements.Endpoints;

namespace PziApi.Movements;

public static class Extensions
{
  public static void RegisterMovementsEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/Movements")
      .WithTags("Movements");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
  }
}
