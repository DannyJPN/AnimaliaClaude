using PziApi.ContractActions.Endpoints;

namespace PziApi.ContractActionss;

public static class Extensions
{
  public static void RegisterContractActionsExportsEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/ContractActions")
      .WithTags("ContractActions");

    endpoints.MapPost("/{id}", Update.Handle);
    endpoints.MapPut("/", Insert.Handle);
    endpoints.MapDelete("/{id}", Delete.Handle);
  }
}
