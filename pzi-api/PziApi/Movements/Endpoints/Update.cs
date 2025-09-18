using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Movements;

namespace PziApi.Movements.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Movement>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.MovementUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.MovementUpdateValidator(dbContext);
    var validationResult = await validator.ValidateAsync(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    Dtos.Movement resultVm;

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var item = await dbContext.Movements.FirstOrDefaultAsync(ac => ac.Id == id);
      var specimen = await dbContext.Specimens
            .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .FirstOrDefaultAsync(s => s.Id == viewModel.SpecimenId);

      if (item == null || specimen == null)
      {
        return TypedResults.NotFound();
      }

      if (item.SpecimenId != viewModel.SpecimenId)
      {
        return TypedResults.NotFound();
      }

      var (
        speciesCounts,
        genusCounts,
        familyCounts,
        orderCounts,
        classCounts,
        phylumCounts
      ) = await QuantityCalculations.GetDataForCalculations(dbContext, specimen);

      // UPDATE BASE ITEM
      item.SpecimenId = item.SpecimenId;
      item.Date = viewModel.Date;
      item.AccountingDate = viewModel.LastModifiedAt;
      item.Quantity = viewModel.Quantity;
      item.QuantityActual = viewModel.QuantityActual;
      item.IncrementReasonCode = viewModel.IncrementReasonCode;
      item.DecrementReasonCode = viewModel.DecrementReasonCode;
      item.LocationId = viewModel.LocationId;
      item.Price = viewModel.Price;
      item.PriceFinal = viewModel.PriceFinal;
      item.Note = viewModel.Note;
      item.ContractId = viewModel.ContractId;
      item.ContractNote = viewModel.ContractNote;
      item.ModifiedBy = viewModel.ModifiedBy;
      item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

      var otherMovements = await dbContext.Movements
            .Where(m => m.SpecimenId == viewModel.SpecimenId && m.Id != item.Id)
            .ToArrayAsync();

      // NOW START CALCULATIONS ON ALL MOVEMENTS
      var allMovements = otherMovements.Concat([item]).ToArray();

      QuantityCalculations.UpdateTaxonomyValues(
        specimen,
        allMovements,
        speciesCounts,
        genusCounts,
        familyCounts,
        orderCounts,
        classCounts,
        phylumCounts
      );

      if (specimen.QuantityInZoo == 0)
      {
        specimen.PlacementDate = null;
        specimen.PlacementLocationId = null;
        specimen.OrganizationLevelId = null;
      }

      await dbContext.SaveChangesAsync();

      resultVm = new Dtos.Movement(
       Id: item.Id,
       SpecimenId: item.SpecimenId
     );

      await tx.CommitAsync();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Movement>.FromItemAndFluentValidation(
        resultVm,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
