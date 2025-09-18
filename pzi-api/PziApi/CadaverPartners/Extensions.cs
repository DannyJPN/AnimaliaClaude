using PziApi.CadaverPartners.Endpoints;

namespace PziApi.CadaverPartners;

public static class Extensions
{
    public static void RegisterCadaverPartnersEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/CadaverPartners")
            .WithTags("CadaverPartners");

        group.MapPut("/", Insert.Handle);
        group.MapPost("/{id}", Update.Handle);
        group.MapDelete("/{id}", Delete.Handle);
    }
}
