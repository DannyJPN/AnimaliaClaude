using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.Specimens.Endpoints;

public class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Specimen>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle([FromBody] Dtos.SpecimenUpdate viewModel, PziDbContext dbContext)
  {
    var validator = new Validators.SpecimenUpdateValidator();
    var validationResult = validator.Validate(viewModel);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);

      return TypedResults.BadRequest(validationErrors);
    }

    

    var item = new Specimen
    {
      SpeciesId = viewModel.SpeciesId!.Value,
      AccessionNumber = viewModel.AccessionNumber,
      GenderTypeCode = viewModel.GenderTypeCode,
      ClassificationTypeCode = viewModel.ClassificationTypeCode,
      Zims = viewModel.Zims,
      StudBookNumber = viewModel.StudBookNumber,
      StudBookName = viewModel.StudBookName,
      Name = viewModel.Name,
      Notch = viewModel.Notch,
      Chip = viewModel.Chip,
      RingNumber = viewModel.RingNumber,
      OtherMarking = viewModel.OtherMarking,
      IsHybrid = viewModel.IsHybrid,
      Location = viewModel.Location,
      BirthDate = viewModel.BirthDate,
      BirthPlace = viewModel.BirthPlace,
      BirthMethod = viewModel.BirthMethod,
      Rearing = viewModel.Rearing,
      FatherId = viewModel.FatherId,
      MotherId = viewModel.MotherId,
      Note = viewModel.Note,
      // OtherDetails = viewModel.OtherDetails,
      // Photo = viewModel.Photo,
      RegisteredDate = viewModel.RegisteredDate,
      RegisteredTo = viewModel.RegisteredTo,
      RegistrationNumber = viewModel.RegistrationNumber,
      // CadaverDate = viewModel.CadaverDate,
      // CadaverPlace = viewModel.CadaverPlace,
      EuPermit = viewModel.EuPermit,
      CzechRegistrationNumber = viewModel.CzechRegistrationNumber,
      FatherZims = viewModel.FatherZims,
      MotherZims = viewModel.MotherZims,
      // RingNumberSecondary = viewModel.RingNumberSecondary,
      // OtherMarkingSecondary = viewModel.OtherMarkingSecondary,
      ChipSecondary = viewModel.ChipSecondary,
      NotchSecondary = viewModel.NotchSecondary,
      Documentation = viewModel.Documentation,
      Ueln = viewModel.Ueln,
      SourceType = 'N',
      ModifiedBy = viewModel.ModifiedBy,
      ModifiedAt = DateTimeHelpers.GetLastModifiedAt()
    };

    dbContext.Specimens.Add(item);

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
