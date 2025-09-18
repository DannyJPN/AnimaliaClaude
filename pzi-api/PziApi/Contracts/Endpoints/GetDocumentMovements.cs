using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Database;
using PziApi.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace PziApi.Contracts.Endpoints;

public static class GetDocumentMovements
{
  public static async Task<Results<Ok<object>, NotFound>> Handle(int contractId, PziDbContext dbContext)
  {
    var exists = await dbContext.Contracts.AnyAsync(c => c.Id == contractId);
    if (!exists)
      return TypedResults.NotFound();

    var movements = await dbContext.Movements
      .Where(m => m.ContractId == contractId)
      .Include(m => m.Specimen)
        .ThenInclude(s => s!.Species)
      .Include(m => m.IncrementReason)
      .Include(m => m.DecrementReason)
      .Include(m => m.Contract)
      .Select(m => new Dtos.DocumentMovement(
        m.Id,
        m.SpecimenId,
        m.Date,
        m.AccountingDate,
        m.Quantity,
        m.QuantityActual,
        m.IncrementReason!.DisplayName,
        m.DecrementReason!.DisplayName,
        m.Contract!.Partner!.Keyword,
        m.Specimen!.GenderTypeCode,
        m.Price,
        m.PriceFinal,
        m.DepType,
        m.Specimen!.Species!.NameLat,
        m.Specimen.AccessionNumber,
        m.Specimen.Name,
        m.Note,
        m.ContractNote
      ))
      .ToListAsync();

    object response = new
    {
      items = movements
    };

    return TypedResults.Ok(response);
  }
}
