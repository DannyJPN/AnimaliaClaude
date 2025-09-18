using PziApi.SpecimensMarkings.Endpoints;

namespace PziApi.SpecimensMarkings;

public static class Extensions
{
  public static void RegisterSpecimensMarkingsEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/Markings")
      .WithTags("Markings");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
  }
}
