using PziApi.Zoos.Endpoints;

namespace PziApi.Zoos;

public static class Extensions
{
    public static void RegisterZoosEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/zoos")
            .WithTags("Zoos");

        group.MapPut("/", Insert.Handle);
        group.MapPost("/{id}", Update.Handle);
        group.MapDelete("/{id}", Delete.Handle);
    }
}
