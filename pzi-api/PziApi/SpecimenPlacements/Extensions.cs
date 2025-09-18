using PziApi.SpecimenPlacements.Endpoints;

namespace PziApi.SpecimenPlacements;

public static class Extensions
{
    public static void RegisterSpecimenPlacementsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/SpecimenPlacements")
            .WithTags("SpecimenPlacements");

        group.MapPut("/", Insert.Handle);
        group.MapPost("/{id}", Update.Handle);
        group.MapDelete("/{id}", Delete.Handle);
    }
}
