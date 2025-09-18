using PziApi.JournalCommon.Endpoints;

namespace PziApi.JournalCommon;

public static class Extensions
{
  public static WebApplication RegisterJournalCommonEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/JournalCommon")
    .WithTags("JournalCommon");

    group.MapGet("/ActionTypes/{entryType}", ActionTypesList.Handle);
    group.MapPost("/SpeciesForUser", SpeciesForUser.Handle);

    return app;
  }
}
