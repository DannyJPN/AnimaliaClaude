using PziApi.OrganizationLevels.Endpoints;

namespace PziApi.OrganizationLevels;

public static class Extensions
{
  public static void RegisterOrganizationLevelsEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/OrganizationLevels")
        .WithTags("OrganizationLevels");

    group.MapPut("/", Insert.Handle);
    group.MapPost("/{id}", Update.Handle);
    group.MapDelete("/{id}", Delete.Handle);
    group.MapPost("/Move", OrganizationsClassMove.Handle);
  }
}
