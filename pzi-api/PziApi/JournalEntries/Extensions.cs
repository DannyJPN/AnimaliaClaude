namespace PziApi.JournalEntries;

public static class Extensions
{
  public static WebApplication RegisterJournaEntriesEndpoints(this WebApplication app)
  {
    var group = app.MapGroup("/api/JournalEntries")
    .WithTags("JournalEntries");

    group.MapPost("/", Endpoints.Insert.Handle);
    group.MapPost("/{id}", Endpoints.Update.Handle);
    group.MapDelete("/{id}", Endpoints.Delete.Handle);
    group.MapPost("/{id}/ToDocumentation", Endpoints.ToDocumentation.Handle);
    group.MapPost("/{id}/ToDone", Endpoints.ToDone.Handle);
    group.MapPost("/{id}/ToProcessed", Endpoints.ToProcessed.Handle);
    group.MapPost("/EntriesForUser", Endpoints.EntriesForUser.Handle);
    group.MapPost("/ActionTypesForUser", Endpoints.ActionTypesForUser.Handle);
    group.MapPost("/DistrictsForUser", Endpoints.DistrictsForUser.Handle);
    group.MapPost("/ProcessApproval", Endpoints.ProcessApproval.Handle);

    return app;
  }
}
