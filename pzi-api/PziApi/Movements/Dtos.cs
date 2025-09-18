namespace PziApi.Movements;

public class Dtos
{
  public record Movement(
    int Id,
    int SpecimenId
  );

  public record MovementUpdate(
    int SpecimenId,
    string Date,
    string LastModifiedAt,
    int Quantity,
    int QuantityActual,
    string? IncrementReasonCode,
    string? DecrementReasonCode,
    int? LocationId,
    decimal? Price,
    decimal? PriceFinal,
    string? Note,
    int? ContractId,
    string? ContractNote,
    string ModifiedBy
  );
}