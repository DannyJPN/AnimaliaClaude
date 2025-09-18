using PziApi.Users.Endpoints;

namespace PziApi.Users;

public static class UsersExtensions
{
  public static void RegisterUsersEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/Users")
      .WithTags("Users");

    endpoints.MapPost("/UserLoggedIn", UserLoggedIn.Handle);
    endpoints.MapPost("/UserSettings", UserSettings.HandleUpdate);
  }
}
