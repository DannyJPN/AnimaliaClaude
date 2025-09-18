using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class ContractsOverview
{
  public record Request(string? Mask, string? MinDate, string? MaxDate);

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x)
          .Must(x => !string.IsNullOrEmpty(x.Mask) || !string.IsNullOrEmpty(x.MinDate) || !string.IsNullOrEmpty(x.MaxDate))
          .WithErrorCode(ErrorCodes.ERR_EMPTY)
          .WithMessage("At least mask or min/max date must be specified");
    }
  }

  public class ContractDto
  {
    public int Id { get; set; }
    public string? Number { get; set; }
    public string? Date { get; set; }
    public string? PartnerKeyword { get; set; }
    public string? MovementReason { get; set; }
    public ICollection<MovementDto> Movements { get; set; } = [];
  }

  public class MovementDto
  {
    public string? Date { get; set; }
    public string? SpeciesNameCz { get; set; }
    public string? SpeciesNameLat { get; set; }
    public string? GenderTypeCode { get; set; }
    public int? AccessionNumber { get; set; }
    public int Quantity { get; set; }
    public decimal? Price { get; set; }
    public string? IncrementReason { get; set; }
    public string? DecrementReason { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<ContractDto[]>>, BadRequest<CommonDtos.ValidationErrors>, ValidationProblem>> Handle(
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

    var contractsQuery = dbContext.Contracts.AsQueryable();

    if (!string.IsNullOrEmpty(request.Mask))
    {
      contractsQuery = contractsQuery.Where(c => EF.Functions.Like(c.Number, $"%{request.Mask}%"));
    }
    else
    {
      var minDate = string.IsNullOrEmpty(request.MinDate) ? DateTime.Now.ToString("yyyy/MM/dd") : request.MinDate;
      var maxDate = string.IsNullOrEmpty(request.MaxDate) ? DateTime.Now.ToString("yyyy/MM/dd") : request.MaxDate;

      contractsQuery = contractsQuery.Where(c =>
        (string.IsNullOrEmpty(request.MinDate) || string.Compare(c.Date!, minDate) >= 0)
        && (string.IsNullOrEmpty(request.MaxDate) || string.Compare(c.Date!, maxDate) <= 0));
    }

    var contractBasics = await contractsQuery
          .Select(c => new ContractDto
          {
            Id = c.Id,
            Number = c.Number,
            Date = c.Date,
            PartnerKeyword = c.Partner != null ? c.Partner.Keyword : null,
            MovementReason = c.MovementReason != null ? c.MovementReason.DisplayName : null
          })
          .OrderBy(c => c.Number)
          .ThenBy(c => c.Date)
          .ToArrayAsync();

    if (contractBasics.Length == 0)
    {
      return TypedResults.Ok(
        CommonDtos.SuccessResult<ContractDto[]>.FromItemAndFluentValidation(
          [], new FluentValidation.Results.ValidationResult()));
    }

    var contractIds = contractBasics.Select(c => c.Id).ToHashSet();

    var movementLookup = await dbContext.Movements
      .Where(m => m.ContractId.HasValue && contractIds.Contains(m.ContractId.Value))
      .Select(m => new
      {
        m.ContractId,
        Dto = new MovementDto
        {
          Date = m.Date,
          SpeciesNameCz = m.Specimen!.Species!.NameCz,
          SpeciesNameLat = m.Specimen!.Species!.NameLat,
          GenderTypeCode = m.Specimen.GenderTypeCode,
          AccessionNumber = m.Specimen.AccessionNumber,
          Quantity = m.Quantity,
          Price = m.Price,
          IncrementReason = m.IncrementReason != null ? m.IncrementReason.DisplayName : null,
          DecrementReason = m.DecrementReason != null ? m.DecrementReason.DisplayName : null,
        }
      })
      .GroupBy(m => m.ContractId!.Value)
      .ToDictionaryAsync(g => g.Key, g => g.Select(x => x.Dto).OrderBy(m => m.Date).ToList());

    foreach (var contract in contractBasics)
    {
      if (movementLookup.TryGetValue(contract.Id, out var list))
      {
        contract.Movements = list;
      }
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<ContractDto[]>.FromItemAndFluentValidation(
        contractBasics,
        new FluentValidation.Results.ValidationResult()));
  }
}

