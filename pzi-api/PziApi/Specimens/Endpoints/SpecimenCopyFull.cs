using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Movements;
using PziApi.Models;
using PziApi.Movements;
namespace PziApi.Specimens.Endpoints;

public class SpecimenCopyRequest
{
    public int SpecimenId { get; set; }
    public string ModifiedBy { get; set; } = null!;
}

public static class SpecimenCopyFull
{
    public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Specimen>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] SpecimenCopyRequest request, PziDbContext dbContext)
    {
        using var tx = await dbContext.Database.BeginTransactionAsync();

        // Načtení původního exempláře
        var originalSpecimen = await dbContext.Specimens
        .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .FirstOrDefaultAsync(s => s.Id == request.SpecimenId);

        if (originalSpecimen == null)
        {
            return TypedResults.NotFound();
        }

        // Zjištění nejvyššího AccessionNumber v tabulce Specimens pro stejný druh (SpeciesId)
        var maxAccessionNumber = await dbContext.Specimens
            .Where(s => s.AccessionNumber != null && s.SpeciesId == originalSpecimen.SpeciesId)
            .MaxAsync(s => s.AccessionNumber) ?? 0;

        // Vytvoření kopie exempláře
        var newSpecimen = new Specimen
        {
            // Kopírování všech vlastností z původního exempláře
            Species = originalSpecimen.Species,
            SpeciesId = originalSpecimen.SpeciesId,
            AccessionNumber = maxAccessionNumber + 1, // Nastavení nového AccessionNumber
            GenderTypeCode = originalSpecimen.GenderTypeCode,
            ClassificationTypeCode = originalSpecimen.ClassificationTypeCode,
            Zims = originalSpecimen.Zims,
            StudBookNumber = originalSpecimen.StudBookNumber,
            StudBookName = originalSpecimen.StudBookName,
            Name = originalSpecimen.Name,
            Notch = originalSpecimen.Notch,
            Chip = originalSpecimen.Chip,
            RingNumber = originalSpecimen.RingNumber,
            OtherMarking = originalSpecimen.OtherMarking,
            IsHybrid = originalSpecimen.IsHybrid,
            Location = originalSpecimen.Location,
            BirthDate = originalSpecimen.BirthDate,
            BirthPlace = originalSpecimen.BirthPlace,
            BirthMethod = originalSpecimen.BirthMethod,
            Rearing = originalSpecimen.Rearing,
            FatherId = originalSpecimen.FatherId,
            MotherId = originalSpecimen.MotherId,
            Note = originalSpecimen.Note,
            OtherDetails = originalSpecimen.OtherDetails,
            RegisteredDate = originalSpecimen.RegisteredDate,
            ModifiedBy = request.ModifiedBy,
            ModifiedAt = DateTimeHelpers.GetLastModifiedAt(),
            RegisteredTo = originalSpecimen.RegisteredTo,
            RegistrationNumber = originalSpecimen.RegistrationNumber,
            CadaverDate = originalSpecimen.CadaverDate,
            CadaverPlace = originalSpecimen.CadaverPlace,
            EuPermit = originalSpecimen.EuPermit,
            CzechRegistrationNumber = originalSpecimen.CzechRegistrationNumber,
            FatherZims = originalSpecimen.FatherZims,
            MotherZims = originalSpecimen.MotherZims,
            RingNumberSecondary = originalSpecimen.RingNumberSecondary,
            OtherMarkingSecondary = originalSpecimen.OtherMarkingSecondary,
            ChipSecondary = originalSpecimen.ChipSecondary,
            NotchSecondary = originalSpecimen.NotchSecondary,
            Documentation = originalSpecimen.Documentation,
            Ueln = originalSpecimen.Ueln,
            SourceType = originalSpecimen.SourceType
        };



        var (
   speciesCounts,
   genusCounts,
   familyCounts,
   orderCounts,
   classCounts,
   phylumCounts
 ) = await QuantityCalculations.GetDataForCalculations(dbContext, newSpecimen);


        dbContext.Specimens.Add(newSpecimen);
        await dbContext.SaveChangesAsync();

        // Načtení souvisejících položek pro původní exemplář
        var movements = await dbContext.Movements
            .Where(m => m.SpecimenId == request.SpecimenId)
            .ToListAsync();

        var placements = await dbContext.Placements
            .Where(p => p.SpecimenId == request.SpecimenId)
            .ToListAsync();

        var specimenPlacements = await dbContext.SpecimenPlacements
            .Where(sp => sp.SpecimenId == request.SpecimenId)
            .ToListAsync();

        var recordSpecimens = await dbContext.RecordSpecimens
            .Where(rs => rs.SpecimenId == request.SpecimenId)
            .ToListAsync();

        // Vytvoření kolekcí pro nové objekty
        var newMovements = new List<Movement>();
        var newPlacements = new List<Placement>();
        var newSpecimenPlacements = new List<SpecimenPlacement>();
        var newRecordSpecimens = new List<RecordSpecimen>();

        // Vytvoření nových objektů a uložení do kolekcí (zatím bez přidání do kontextu)
        if (movements != null && movements.Count > 0)
        {
            foreach (var movement in movements)
            {
                var newMovement = new Movement
                {
                    SpecimenId = newSpecimen.Id,
                    Date = movement.Date,
                    Quantity = movement.Quantity,
                    QuantityActual = movement.QuantityActual,
                    IncrementReasonCode = movement.IncrementReasonCode,
                    DecrementReasonCode = movement.DecrementReasonCode,
                    LocationId = movement.LocationId,
                    CitesImport = movement.CitesImport,
                    CitesExport = movement.CitesExport,
                    Price = movement.Price,
                    Note = movement.Note,
                    Gender = movement.Gender,
                    AccountingDate = movement.AccountingDate,
                    PriceFinal = movement.PriceFinal,
                    DepType = movement.DepType,
                    ContractNumber = movement.ContractNumber,
                    ContractNote = movement.ContractNote,
                    ContractId = movement.ContractId,
                    SourceType = movement.SourceType,
                    ModifiedBy = request.ModifiedBy,
                    ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
                };
                newMovements.Add(newMovement);
            }
        }

        if (placements != null && placements.Count > 0)
        {
            foreach (var placement in placements)
            {
                var newPlacement = new Placement
                {
                    SpecimenId = newSpecimen.Id,
                    OriginSpecimenId = placement.OriginSpecimenId,
                    RegionId = placement.RegionId,
                    Date = placement.Date,
                    Note = placement.Note,
                    ModifiedBy = request.ModifiedBy,
                    ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
                };
                newPlacements.Add(newPlacement);
            }
        }

        if (specimenPlacements != null && specimenPlacements.Count > 0)
        {
            foreach (var specimenPlacement in specimenPlacements)
            {
                var newSpecimenPlacement = new SpecimenPlacement
                {
                    SpecimenId = newSpecimen.Id,
                    ValidSince = specimenPlacement.ValidSince,
                    LocationId = specimenPlacement.LocationId,
                    OrganizationLevelId = specimenPlacement.OrganizationLevelId,
                    ModifiedBy = request.ModifiedBy,
                    ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
                };
                newSpecimenPlacements.Add(newSpecimenPlacement);
            }
        }

        if (recordSpecimens != null && recordSpecimens.Count > 0)
        {
            foreach (var recordSpecimen in recordSpecimens)
            {
                var newRecordSpecimen = new RecordSpecimen
                {
                    SpecimenId = newSpecimen.Id,
                    Date = recordSpecimen.Date,
                    ActionTypeCode = recordSpecimen.ActionTypeCode,
                    Note = recordSpecimen.Note,
                    PartnerId = recordSpecimen.PartnerId,
                    ModifiedBy = request.ModifiedBy,
                    ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
                };
                newRecordSpecimens.Add(newRecordSpecimen);
            }
        }

        // Nyní přidáme všechny objekty do kontextu databáze

        if (newMovements.Count > 0)
        {
            dbContext.Movements.AddRange(newMovements);
        }

        if (newPlacements.Count > 0)
        {
            dbContext.Placements.AddRange(newPlacements);
        }

        if (newSpecimenPlacements.Count > 0)
        {
            dbContext.SpecimenPlacements.AddRange(newSpecimenPlacements);
        }

        if (newRecordSpecimens.Count > 0)
        {
            dbContext.RecordSpecimens.AddRange(newRecordSpecimens);
        }
        var otherMovements = await dbContext.Movements
            .Where(m => m.SpecimenId == newSpecimen.Id)
            .ToArrayAsync();

        QuantityCalculations.UpdateTaxonomyValues(
          newSpecimen,
          otherMovements,
          speciesCounts,
          genusCounts,
          familyCounts,
          orderCounts,
          classCounts,
          phylumCounts
        );


        await dbContext.SaveChangesAsync();
        await tx.CommitAsync();


        var resultDto = new Dtos.Specimen(
            Id: newSpecimen.Id,
            SpeciesId: newSpecimen.SpeciesId,
            AccessionNumber: newSpecimen.AccessionNumber,
            GenderTypeCode: newSpecimen.GenderTypeCode,
            ClassificationTypeCode: newSpecimen.ClassificationTypeCode,
            Zims: newSpecimen.Zims,
            StudBookNumber: newSpecimen.StudBookNumber,
            StudBookName: newSpecimen.StudBookName,
            Name: newSpecimen.Name,
            Notch: newSpecimen.Notch,
            Chip: newSpecimen.Chip,
            RingNumber: newSpecimen.RingNumber,
            OtherMarking: newSpecimen.OtherMarking,
            IsHybrid: newSpecimen.IsHybrid,
            Location: newSpecimen.Location,
            BirthDate: newSpecimen.BirthDate,
            BirthPlace: newSpecimen.BirthPlace,
            BirthMethod: newSpecimen.BirthMethod,
            Rearing: newSpecimen.Rearing,
            FatherId: newSpecimen.FatherId,
            MotherId: newSpecimen.MotherId,
            Note: newSpecimen.Note,
            OtherDetails: newSpecimen.OtherDetails,
            RegisteredDate: newSpecimen.RegisteredDate,
            ModifiedBy: newSpecimen.ModifiedBy!,
            RegisteredTo: newSpecimen.RegisteredTo,
            RegistrationNumber: newSpecimen.RegistrationNumber,
            CadaverDate: newSpecimen.CadaverDate,
            CadaverPlace: newSpecimen.CadaverPlace,
            EuPermit: newSpecimen.EuPermit,
            CzechRegistrationNumber: newSpecimen.CzechRegistrationNumber,
            FatherZims: newSpecimen.FatherZims,
            MotherZims: newSpecimen.MotherZims,
            RingNumberSecondary: newSpecimen.RingNumberSecondary,
            OtherMarkingSecondary: newSpecimen.OtherMarkingSecondary,
            ChipSecondary: newSpecimen.ChipSecondary,
            NotchSecondary: newSpecimen.NotchSecondary,
            Documentation: newSpecimen.Documentation,
            Ueln: newSpecimen.Ueln
        );

        return TypedResults.Ok(
            CommonDtos.SuccessResult<Dtos.Specimen>.FromItemAndFluentValidation(
                resultDto,
                new FluentValidation.Results.ValidationResult()
            )
        );
    }
}

