using PziApi.Locations.Endpoints;

namespace PziApi.Locations;

public static class Extensions
{
  public static void RegisterLocationsEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/Locations")
        .WithTags("Locations");

    group.MapPut("/", Insert.Handle);
    group.MapPost("/{id}", Update.Handle);
    group.MapDelete("/{id}", Delete.Handle);
    group.MapPost("/moveInOrganization", LocationsInOrganizationMove.Handle);
    group.MapPost("/moveInExposition", LocationsInExpositionMove.Handle);
  }
}
