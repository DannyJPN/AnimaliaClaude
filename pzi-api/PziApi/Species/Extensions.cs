using PziApi.Species.Endpoints;

namespace PziApi.Species;

public static class SpeciesExtensions
{
  public static void RegisterSpeciesEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/Species")
      .WithTags("Species");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
    classEndpoints.MapPost("/Move", SpeciesMove.Handle);
    classEndpoints.MapPost("/MassSpecimenRecords", MassSpecimenRecords.Handle);
  }
}
