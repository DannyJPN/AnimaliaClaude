using PziApi.SpeciesRecords.Endpoints;

namespace PziApi.SpeciesRecords;

public static class Extensions
{
  public static void RegisterRecordSpeciesEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/RecordSpecies")
      .WithTags("RecordSpecies");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
  }
}