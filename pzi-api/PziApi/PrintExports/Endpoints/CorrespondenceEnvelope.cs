// Sestavy / Korespondence - Obalka

using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class CorrespondenceEnvelope
{
  public record Request(int? PartnerId, string? ZooId);

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x)
        .Must(x => x.PartnerId.HasValue || !string.IsNullOrEmpty(x.ZooId))
        .WithErrorCode(ErrorCodes.ERR_EMPTY)
        .WithMessage("Either PartnerId or ZooId must be specified");
    }
  }

  public class EnvelopeDto
  {
    public string? SenderName { get; set; }
    public string? SenderStreet { get; set; }
    public string? SenderPostalCity { get; set; }
    public string? RecipientCompany { get; set; }
    public string? RecipientName { get; set; }
    public string? RecipientStreet { get; set; }
    public string? RecipientPostalCode { get; set; }
    public string? RecipientCity { get; set; }
    public string? RecipientCountry { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<EnvelopeDto>>, BadRequest<CommonDtos.ValidationErrors>, NotFound, ValidationProblem>> Handle(
    [FromBody] Request request,
    PziDbContext dbContext)
  {
    var validator = new RequestValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var envelope = new EnvelopeDto();

    // Load sender information from Zoos table with ID "PRA"
    var sender = await dbContext.Zoos
      .Where(z => z.Id == "PRA")
      .Select(z => new
      {
        z.Name,
        z.StreetNumber,
        z.PostalCode,
        z.City
      })
      .FirstOrDefaultAsync();

    if (sender != null)
    {
      envelope.SenderName = sender.Name;
      envelope.SenderStreet = sender.StreetNumber;
      envelope.SenderPostalCity = !string.IsNullOrEmpty(sender.PostalCode) && !string.IsNullOrEmpty(sender.City)
        ? $"{sender.PostalCode} {sender.City}"
        : sender.City ?? "";
    }

    if (request.PartnerId.HasValue)
    {
      // Get partner information
      var partner = await dbContext.Partners
        .Where(p => p.Id == request.PartnerId.Value)
        .Select(p => new
        {
          p.Name,
          p.FirstName,
          p.LastName,
          p.StreetAddress,
          p.PostalCode,
          p.City,
          p.Country
        })
        .FirstOrDefaultAsync();

      if (partner == null)
      {
        return TypedResults.NotFound();
      }

      // Set recipient information - using single Obalka-O format
      envelope.RecipientCompany = partner.Name;
      envelope.RecipientName = !string.IsNullOrEmpty(partner.FirstName) && !string.IsNullOrEmpty(partner.LastName)
        ? $"{partner.FirstName} {partner.LastName}"
        : null;

      envelope.RecipientStreet = partner.StreetAddress;
      envelope.RecipientPostalCode = partner.PostalCode;
      envelope.RecipientCity = partner.City;
      envelope.RecipientCountry = partner.Country;
    }
    else if (!string.IsNullOrEmpty(request.ZooId))
    {
      // Get zoo information
      var zoo = await dbContext.Zoos
        .Where(z => z.Id == request.ZooId)
        .Select(z => new
        {
          z.Name,
          z.FirstName,
          z.LastName,
          z.StreetNumber,
          z.PostalCode,
          z.City,
          z.Country
        })
        .FirstOrDefaultAsync();

      if (zoo == null)
      {
        return TypedResults.NotFound();
      }

      // Set recipient information - using single Obalka-O format
      envelope.RecipientCompany = zoo.Name;
      envelope.RecipientName = !string.IsNullOrEmpty(zoo.FirstName) && !string.IsNullOrEmpty(zoo.LastName)
        ? $"{zoo.FirstName} {zoo.LastName}"
        : null;

      envelope.RecipientStreet = zoo.StreetNumber;
      envelope.RecipientPostalCode = zoo.PostalCode;
      envelope.RecipientCity = zoo.City;
      envelope.RecipientCountry = zoo.Country;
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<EnvelopeDto>.FromItemAndFluentValidation(
        envelope,
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
