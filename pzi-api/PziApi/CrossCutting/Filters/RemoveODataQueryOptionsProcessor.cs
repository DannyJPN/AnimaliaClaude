using NSwag.Generation.Processors;
using NSwag.Generation.Processors.Contexts;

namespace PziApi.CrossCutting.Filters;

public class RemoveODataQueryOptionsProcessor : IOperationProcessor
{
  public bool Process(OperationProcessorContext context)
  {
    var path = context.OperationDescription.Path?.ToLowerInvariant();

    // Keep OData query parameters only for /odata/ routes
    if (path != null && !path.StartsWith("/odata"))
    {
      var parametersToRemove = context.OperationDescription.Operation.Parameters
          .Where(p => p.Name.StartsWith("$"))
          .ToList();

      foreach (var param in parametersToRemove)
      {
        context.OperationDescription.Operation.Parameters.Remove(param);
      }
    }

    return true;
  }
}
