namespace PziApi.Zoos;

public class Dtos
{
  public record Item(
    string Id
  );

  public record Update(
    string Id,
    string Keyword,
    string? Name,
    string? City,
    string? StreetNumber,
    string? PostalCode,
    string? Country,
    string? Phone,
    string? Email,
    string? Website,
    string? LastName,
    string? FirstName,
    string? Note,
    string ModifiedBy
  );
}
