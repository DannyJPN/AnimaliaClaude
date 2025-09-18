using NSwag;
using NSwag.Generation.Processors;
using NSwag.Generation.Processors.Contexts;

namespace PziApi.CrossCutting.OData;

public class ODataOperationProcessor : IOperationProcessor
{
  public bool Process(OperationProcessorContext context)
  {
    if (context.OperationDescription.Method == OpenApiOperationMethod.Get)
    {
      var odataParams = new[] { "$filter", "$select", "$expand", "$orderby", "$top", "$skip", "$count" };
      foreach (var param in odataParams)
      {
        context.OperationDescription.Operation.Parameters.Add(new OpenApiParameter
        {
          Name = param,
          Kind = OpenApiParameterKind.Query,
          Type = NJsonSchema.JsonObjectType.String,
          IsRequired = false,
          Description = $"OData query option: {param}"
        });
      }
    }

    return true;
  }
}
