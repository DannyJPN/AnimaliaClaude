using PziApi.Models;
using PziApi.Specimens.Endpoints;

namespace PziApi.Specimens;

public static class SpecimensExtensions
{
  public static void RegisterSpecimensEndpoints(this WebApplication app)
  {
    var classEndpoints = app.MapGroup("/api/Specimens")
      .WithTags("Specimens");

    classEndpoints.MapPost("/SpecimensView", GetListViewItems.Handle);
    classEndpoints.MapPost("/{id}", Update.Handle);
    classEndpoints.MapPut("/", Insert.Handle);
    classEndpoints.MapDelete("/{id}", Delete.Handle);
    classEndpoints.MapPost("/CopyFull", SpecimenCopyFull.Handle);
    classEndpoints.MapPost("/CopyPartial", SpecimenCopyPartial.Handle);
    classEndpoints.MapPost("/Move", SpecimenMove.Handle);
  }
}