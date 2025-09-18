using PziApi.Rearings.Endpoints;

namespace PziApi.Rearings;

public static class Extensions
{
    public static void RegisterRearingsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/rearings")
            .WithTags("Rearings");

        group.MapPut("/", Insert.Handle);
        group.MapPost("/{code}", Update.Handle);
        group.MapDelete("/{code}", Delete.Handle);
    }
}
