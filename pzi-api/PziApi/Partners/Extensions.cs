using PziApi.Partners.Endpoints;

namespace PziApi.Partners;

public static class Extensions
{
    public static void RegisterPartnersEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/Partners")
            .WithTags("Partners");

        group.MapPut("/", Insert.Handle);
        group.MapPost("/{id}", Update.Handle);
        group.MapDelete("/{id}", Delete.Handle);
    }
}
