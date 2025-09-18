namespace PziApi.Partners;

public class Dtos
{
  public record Item(
    int Id
  );

  public record Update(
    string Keyword,
    string? Name,
    string? Status,
    string? City,
    string? StreetAddress,
    string? PostalCode,
    string? Country,
    string? Phone,
    string? Email,
    string? PartnerType,
    string? LastName,
    string? FirstName,
    string? Note,
    string ModifiedBy
  );
}
