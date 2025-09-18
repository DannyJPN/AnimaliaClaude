namespace PziApi.ContractActions;

public class Dtos
{
  public record Item(
    int Id
  );

  public record ContractActionUpdate(
    int ContractId,
    string? Date,
    string? ActionTypeCode,
    string? ActionInitiatorCode,
    string? Note,
    string? ModifiedBy
  );
}
