namespace PziApi.CadaverPartners;

public class Dtos
{
  public record Item(
    int Id
  );

  public record Update(
    string Keyword,
    string? Name,
    string? City,
    string? StreetAndNumber,
    string? PostalCode,
    string? Country,
    string? Phone,
    string? Email,
    string? LastName,
    string? FirstName,
    string? Note,
    string ModifiedBy
  );
}
