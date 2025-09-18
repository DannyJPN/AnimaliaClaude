using PziApi.SpecimensRecords.Endpoints;

namespace PziApi.SpecimensRecords;

public static class Extensions
{
  public static void RegisterSpecimensRecordsEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/RecordSpecimens")
      .WithTags("RecordSpecimens");

    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
  }
}
