using PziApi.TaxonomyOrders.Endpoints;

namespace PziApi.TaxonomyOrders;

public static class OrdersExtensions
{
  public static void RegisterTaxonomyOrdersEndpoints(this WebApplication app)
  {
    var endpoints = app.MapGroup("/api/TaxonomyOrders")
      .WithTags("TaxonomyOrders");

    endpoints.MapPost("/{id}", Update.Handle);
    endpoints.MapPut("/", Insert.Handle); 
    endpoints.MapDelete("/{id}", Delete.Handle);
    endpoints.MapPost("/Move", TaxonomyOrderMove.Handle);
  }
}
