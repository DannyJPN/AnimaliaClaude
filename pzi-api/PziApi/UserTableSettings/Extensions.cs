using PziApi.UserTableSettings.Endpoints;

namespace PziApi.UserTableSettings;

public static class Extensions
{
  public static void RegisterUserTableSettingsEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/UserTableSettings")
      .WithTags("UserTableSettings");

    endpoints.MapPost("/SetSettings", SetSettings.Handle);
  }
}
