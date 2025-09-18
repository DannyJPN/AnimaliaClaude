using PziApi.SpecimensCadavers.Endpoints;

namespace PziApi.SpecimensCadavers;

public static class Extensions
{
  public static void RegisterSpecimensCadaversEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/Cadavers")
      .WithTags("Cadavers");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
  }
}
