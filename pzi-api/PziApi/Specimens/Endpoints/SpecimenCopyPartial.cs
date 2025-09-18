using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.Specimens.Endpoints;

public class SpecimenPartialCopyRequest
{
    public int SpecimenId { get; set; }
    public string ModifiedBy { get; set; } = null!;
}

public static class SpecimenCopyPartial
{
    public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Specimen>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
        [FromBody] SpecimenPartialCopyRequest request,
        PziDbContext dbContext)
    {
        using var tx = await dbContext.Database.BeginTransactionAsync();

        var originalSpecimen = await dbContext.Specimens
            .Include(s => s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylum)
            .FirstOrDefaultAsync(s => s.Id == request.SpecimenId);

        if (originalSpecimen == null)
        {
            return TypedResults.NotFound();
        }

        var maxAccessionNumber = await dbContext.Specimens
            .Where(s => s.AccessionNumber != null && s.SpeciesId == originalSpecimen.SpeciesId)
            .MaxAsync(s => s.AccessionNumber) ?? 0;

        var newSpecimen = new Specimen
        {
            Species = originalSpecimen.Species,
            SpeciesId = originalSpecimen.SpeciesId,
            AccessionNumber = maxAccessionNumber + 1,
            GenderTypeCode = originalSpecimen.GenderTypeCode,
            ClassificationTypeCode = originalSpecimen.ClassificationTypeCode,
            IsHybrid = originalSpecimen.IsHybrid,
            FatherId = originalSpecimen.FatherId,
            MotherId = originalSpecimen.MotherId,
            Zims = originalSpecimen.Zims,
            Name = originalSpecimen.Name,
            StudBookNumber = originalSpecimen.StudBookNumber,
            StudBookName = originalSpecimen.StudBookName,
            Location = originalSpecimen.Location,
            BirthDate = originalSpecimen.BirthDate,
            BirthPlace = originalSpecimen.BirthPlace,
            BirthMethod = originalSpecimen.BirthMethod,
            ModifiedBy = request.ModifiedBy,
            ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
        };

        dbContext.Specimens.Add(newSpecimen);
        await dbContext.SaveChangesAsync();
        await tx.CommitAsync();

        var resultDto = new Dtos.Specimen(
            Id: newSpecimen.Id,
            SpeciesId: newSpecimen.SpeciesId,
            AccessionNumber: newSpecimen.AccessionNumber,
            GenderTypeCode: newSpecimen.GenderTypeCode,
            ClassificationTypeCode: newSpecimen.ClassificationTypeCode,
            Zims: newSpecimen.Zims,
            StudBookNumber: null,
            StudBookName: null,
            Name: newSpecimen.Name,
            Notch: null,
            Chip: null,
            RingNumber: null,
            OtherMarking: null,
            IsHybrid: newSpecimen.IsHybrid,
            Location: null,
            BirthDate: null,
            BirthPlace: null,
            BirthMethod: null,
            Rearing: null,
            FatherId: null,
            MotherId: null,
            Note: null,
            OtherDetails: null,
            RegisteredDate: null,
            ModifiedBy: newSpecimen.ModifiedBy!,
            RegisteredTo: null,
            RegistrationNumber: null,
            CadaverDate: null,
            CadaverPlace: null,
            EuPermit: null,
            CzechRegistrationNumber: null,
            FatherZims: null,
            MotherZims: null,
            RingNumberSecondary: null,
            OtherMarkingSecondary: null,
            ChipSecondary: null,
            NotchSecondary: null,
            Documentation: null,
            Ueln: null
        );

        return TypedResults.Ok(
            CommonDtos.SuccessResult<Dtos.Specimen>.FromItemAndFluentValidation(
                resultDto,
                new FluentValidation.Results.ValidationResult()
            )
        );
    }
}
