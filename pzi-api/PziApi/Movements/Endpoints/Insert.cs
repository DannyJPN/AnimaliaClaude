using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;
using PziApi.Models;

namespace PziApi.Movements.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Movement>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.MovementUpdate viewModel, PziDbContext dbContext)
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
      var specimen = await dbContext.Specimens
            .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .FirstOrDefaultAsync(s => s.Id == viewModel.SpecimenId);

      if (specimen == null)
      {
        return TypedResults.NotFound();
      }

      var species = specimen.Species!;
      var genus = species.TaxonomyGenus!;
      var family = genus.TaxonomyFamily!;
      var order = family.TaxonomyOrder!;
      var taxonomyClass = order.TaxonomyClass!;
      var phylum = taxonomyClass.TaxonomyPhylum!;

      var (
        speciesCounts,
        genusCounts,
        familyCounts,
        orderCounts,
        classCounts,
        phylumCounts
      ) = await QuantityCalculations.GetDataForCalculations(dbContext, specimen);

      var otherMovements = await dbContext.Movements
            .Where(m => m.SpecimenId == viewModel.SpecimenId)
            .ToArrayAsync();

      var item = new Movement
      {
        SpecimenId = viewModel.SpecimenId,
        Date = viewModel.Date,
        AccountingDate = viewModel.LastModifiedAt,
        Quantity = viewModel.Quantity,
        QuantityActual = viewModel.QuantityActual,
        IncrementReasonCode = viewModel.IncrementReasonCode,
        DecrementReasonCode = viewModel.DecrementReasonCode,
        LocationId = viewModel.LocationId,
        Price = viewModel.Price,
        Note = viewModel.Note,
        ContractId = viewModel.ContractId,
        ContractNote = viewModel.ContractNote,
        ModifiedBy = viewModel.ModifiedBy,
        ModifiedAt = DateTimeHelpers.GetLastModifiedAt(),
        SourceType = "N"
      };

      dbContext.Movements.Add(item);

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
