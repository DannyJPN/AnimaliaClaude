using PziApi.BirthMethods.Endpoints;

namespace PziApi.BirthMethods;

public static class Extensions
{
    public static void RegisterBirthMethodsEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/birthmethods")
            .WithTags("BirthMethods");

        group.MapPut("/", Insert.Handle);
        group.MapPost("/{code}", Update.Handle);
        group.MapDelete("/{code}", Delete.Handle);
    }
}
