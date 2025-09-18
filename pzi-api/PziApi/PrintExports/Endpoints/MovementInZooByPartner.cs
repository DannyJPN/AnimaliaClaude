using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class MovementInZooByPartner
{
    public record Request(string MinDate, string MaxDate, int PartnerId);

    public class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.MinDate).NotEmpty().Must(DateTimeHelpers.IsValidDateStringInput).WithMessage("MinDate must be provided and valid.");
            RuleFor(x => x.MaxDate).NotEmpty().Must(DateTimeHelpers.IsValidDateStringInput).WithMessage("MaxDate must be provided and valid.");
            RuleFor(x => x.PartnerId).GreaterThan(0).WithMessage("PartnerId must be a positive integer.");
        }
    }

    public class MovementDto
    {
        public int Id { get; set; }
        public string Date { get; set; } = string.Empty;
        public string? SpeciesNameCz { get; set; }
        public string? SpeciesNameLat { get; set; }
        public string? Gender { get; set; }
        public int? AccessionNumber { get; set; }
        public string? IncrementReason { get; set; }
        public string? DecrementReason { get; set; }
        public string? ContractNumber { get; set; }
        public string? PartnerName { get; set; }
        public string? Note { get; set; }
    }

    public class PartnerMovementDto
    {
        public int PartnerId { get; set; }
        public List<MovementDto> Movements { get; set; } = new();
    }

    public static async Task<Results<Ok<CommonDtos.SuccessResult<PartnerMovementDto>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
        [FromBody] Request request,
        PziDbContext dbContext)
    {
        var validator = new Validator();
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return TypedResults.BadRequest(CommonDtos.ValidationErrors.FromFluentValidation(validationResult));
        }

        var minYear = request.MinDate.Substring(0, 4);
        var maxYear = request.MaxDate.Substring(0, 4);

        var movementsQuery = dbContext.Movements
            .Where(m => m.Date != null && m.Date.Length >= 4 &&
                    string.Compare(m.Date.Substring(0, 4), minYear) >= 0 &&
                    string.Compare(m.Date.Substring(0, 4), maxYear) <= 0)
            .Where(m => m.LocationId == request.PartnerId);

        var movementsFromDb = await movementsQuery
            .Select(m => new
            {
                Movement = new MovementDto
                {
                    Id = m.Id,
                    Date = m.Date ?? string.Empty,
                    SpeciesNameCz = m.Specimen!.Species!.NameCz,
                    SpeciesNameLat = m.Specimen!.Species!.NameLat,
                    Gender = m.Specimen!.GenderTypeCode,
                    AccessionNumber = m.Specimen!.AccessionNumber,
                    IncrementReason = m.IncrementReason!.DisplayName,
                    DecrementReason = m.DecrementReason!.DisplayName,
                    ContractNumber = m.Contract!.Number,
                    PartnerName = m.Partner!.Keyword,
                    Note = m.Note,
                },
                LocationId = m.LocationId
            })
            .ToListAsync();

        var filteredMovements = movementsFromDb
            .Where(m => DateTimeHelpers.CompareDates(m.Movement.Date, request.MinDate) >= 0 &&
                         DateTimeHelpers.CompareDates(m.Movement.Date, request.MaxDate) <= 0)
            .OrderBy(m => m.Movement.Date, Comparer<string>.Create((d1, d2) => DateTimeHelpers.CompareDates(d1, d2)))
            .ThenBy(m => m.Movement.AccessionNumber)
            .ToList();

        var result = new PartnerMovementDto
        {
            PartnerId = request.PartnerId,
            Movements = filteredMovements.Select(m => m.Movement).ToList()
        };

        return TypedResults.Ok(
            CommonDtos.SuccessResult<PartnerMovementDto>.FromItemAndFluentValidation(
                result,
                new FluentValidation.Results.ValidationResult()
            )
        );
    }
}


