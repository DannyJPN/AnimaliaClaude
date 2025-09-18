using PziApi.SpecimenImages.Endpoints;

namespace PziApi.SpecimenImages;

public static class Extensions
{
  public static void RegisterSpecimenImagesEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/SpecimenImages")
      .WithTags("SpecimenImages");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
  }
}
