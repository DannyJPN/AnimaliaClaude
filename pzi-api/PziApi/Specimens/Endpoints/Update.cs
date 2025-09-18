using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Specimens.Endpoints;

public class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Specimen>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(int id, [FromBody] Dtos.SpecimenUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.SpecimenUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    var item = await dbContext.Specimens.FirstOrDefaultAsync(s => s.Id == id);
    if (item == null)
    {
      return TypedResults.NotFound();
    }

    item.SpeciesId = viewModel.SpeciesId!.Value;
    item.AccessionNumber = viewModel.AccessionNumber;
    item.GenderTypeCode = viewModel.GenderTypeCode;
    item.ClassificationTypeCode = viewModel.ClassificationTypeCode!;
    item.Zims = viewModel.Zims;
    item.StudBookNumber = viewModel.StudBookNumber;
    item.StudBookName = viewModel.StudBookName;
    item.Name = viewModel.Name;
    item.Notch = viewModel.Notch;
    item.Chip = viewModel.Chip;
    item.RingNumber = viewModel.RingNumber;
    item.OtherMarking = viewModel.OtherMarking;
    item.IsHybrid = viewModel.IsHybrid;
    item.Location = viewModel.Location;
    item.BirthDate = viewModel.BirthDate;
    item.BirthPlace = viewModel.BirthPlace;
    item.BirthMethod = viewModel.BirthMethod;
    item.Rearing = viewModel.Rearing;
    item.FatherId = viewModel.FatherId;
    item.MotherId = viewModel.MotherId;
    item.Note = viewModel.Note;
    // item.OtherDetails = viewModel.OtherDetails;
    // item.Photo = viewModel.Photo;
    item.RegisteredDate = viewModel.RegisteredDate;
    item.RegisteredTo = viewModel.RegisteredTo;
    item.RegistrationNumber = viewModel.RegistrationNumber;
    // item.CadaverDate = viewModel.CadaverDate;
    // item.CadaverPlace = viewModel.CadaverPlace;
    item.EuPermit = viewModel.EuPermit;
    item.CzechRegistrationNumber = viewModel.CzechRegistrationNumber;
    item.FatherZims = viewModel.FatherZims;
    item.MotherZims = viewModel.MotherZims;
    // item.RingNumberSecondary = viewModel.RingNumberSecondary;
    // item.OtherMarkingSecondary = viewModel.OtherMarkingSecondary;
    item.ChipSecondary = viewModel.ChipSecondary;
    item.NotchSecondary = viewModel.NotchSecondary;
    item.Documentation = viewModel.Documentation;
    item.Ueln = viewModel.Ueln;
    item.ModifiedBy = viewModel.ModifiedBy;
    item.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();

    await dbContext.SaveChangesAsync();

    var resultVm = new Dtos.Specimen(
      Id: item.Id,
      SpeciesId: item.SpeciesId,
      AccessionNumber: item.AccessionNumber,
      GenderTypeCode: item.GenderTypeCode,
      ClassificationTypeCode: item.ClassificationTypeCode,
      Zims: item.Zims,
      StudBookNumber: item.StudBookNumber,
      StudBookName: item.StudBookName,
      Name: item.Name,
      Notch: item.Notch,
      Chip: item.Chip,
      RingNumber: item.RingNumber,
      OtherMarking: item.OtherMarking,
      IsHybrid: item.IsHybrid,
      Location: item.Location,
      BirthDate: item.BirthDate,
      BirthPlace: item.BirthPlace,
      BirthMethod: item.BirthMethod,
      Rearing: item.Rearing,
      FatherId: item.FatherId,
      MotherId: item.MotherId,
      Note: item.Note,
      OtherDetails: item.OtherDetails,
      RegisteredDate: item.RegisteredDate,
      RegisteredTo: item.RegisteredTo,
      RegistrationNumber: item.RegistrationNumber,
      CadaverDate: item.CadaverDate,
      CadaverPlace: item.CadaverPlace,
      EuPermit: item.EuPermit,
      CzechRegistrationNumber: item.CzechRegistrationNumber,
      FatherZims: item.FatherZims,
      MotherZims: item.MotherZims,
      RingNumberSecondary: item.RingNumberSecondary,
      OtherMarkingSecondary: item.OtherMarkingSecondary,
      ChipSecondary: item.ChipSecondary,
      NotchSecondary: item.NotchSecondary,
      Documentation: item.Documentation,
      Ueln: item.Ueln,
      ModifiedBy: item.ModifiedBy
    );

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Specimen>.FromItemAndFluentValidation(
        resultVm,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
