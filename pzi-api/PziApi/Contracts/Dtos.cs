namespace PziApi.Contracts;

public class Dtos
{
  public record Item(
    int Id
  );

  public record ContractUpdate(
    string? Number,
    string? Date,
    string? MovementReasonCode,
    string? ContractTypeCode,
    int? PartnerId,
    string? Note,
    string? NotePrague,
    string? NotePartner,
    int? Year,
    string? ModifiedBy
  );

  public record DocumentMovement(
    int Id,
    int SpecimenId,
    string Date,
    string? AccountingDate,
    int Quantity,
    int QuantityActual,
    string? IncrementReasonName,
    string? DecrementReasonName,
    string? LocationName,
    string? Gender,
    decimal? Price,
    decimal? PriceFinal,
    string? DepType,
    string? SpeciesNameLat,
    int? AccessionNumber,
    string? Name,
    string? Note,
    string? ContractNote
  );
}
