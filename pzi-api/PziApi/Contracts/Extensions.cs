using Microsoft.AspNetCore.Builder;
using PziApi.Contracts.Endpoints;

namespace PziApi.Contracts;

public static class Extensions
{
  public static void RegisterContractsExportsEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/Contracts")
      .WithTags("Contracts");

    endpoints.MapPost("/{id}", Update.Handle);
    endpoints.MapPut("/", Insert.Handle);
    endpoints.MapDelete("/{id}", Delete.Handle);
    endpoints.MapPost("/{contractId}/movements", GetDocumentMovements.Handle);
  }
}
