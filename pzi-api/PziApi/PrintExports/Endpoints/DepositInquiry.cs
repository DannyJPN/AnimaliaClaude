using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public static class DepositInquiry
{
    public record Request(int PartnerId);

    public class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.PartnerId)
                .GreaterThan(0)
                .WithMessage("PartnerId is required and must be a positive integer.");
        }
    }

    public class DepositDto
    {
        public string PartnerKeyword { get; set; } = string.Empty;
        public string? PartnerName { get; set; }
        public string? PartnerStreetAddress { get; set; }
        public string? PartnerPostalCode { get; set; }
        public string? PartnerCity { get; set; }
        public string? PartnerCountry { get; set; }
        public List<DepositMovementDto> DepositsTo { get; set; } = new();
        public List<DepositMovementDto> DepositsFrom { get; set; } = new();
    }

    public class DepositMovementDto
    {
        public int SpecimenId { get; set; }
        public string? MovementDate { get; set; }
        public string? Gender { get; set; }
        public int? AccessionNumber { get; set; }
        public string? SpeciesNameLat { get; set; }
        public string? SpeciesNameCz { get; set; }
    }

    public record ResponseDto(List<DepositDto> Deposits);

    public static async Task<Results<Ok<CommonDtos.SuccessResult<ResponseDto>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
        [FromBody] Request request,
        PziDbContext dbContext)
    {
        var validator = new Validator();
        var validationResult = validator.Validate(request);
        if (!validationResult.IsValid)
        {
            return TypedResults.BadRequest(CommonDtos.ValidationErrors.FromFluentValidation(validationResult));
        }

        var selectedPartner = await dbContext.Partners
            .Where(p => p.Id == request.PartnerId )
            .FirstOrDefaultAsync();

        if (selectedPartner == null)
        {
            return TypedResults.Ok(
                CommonDtos.SuccessResult<ResponseDto>.FromItemAndFluentValidation(
                    new ResponseDto(new List<DepositDto>()),
                    new FluentValidation.Results.ValidationResult()
                )
            );
        }

        var partnerMovements = await dbContext.Movements
            .Where(m => m.Partner != null && m.Partner.Id == selectedPartner.Id &&
                       (m.DecrementReasonCode == "OUT05" || m.IncrementReasonCode == "IN05"))
            .Include(m => m.Specimen)
                .ThenInclude(s => s!.TaxonomyHierarchyView)
            .ToListAsync();



        var depositDto = new DepositDto
        {
            PartnerKeyword = selectedPartner.Keyword,
            PartnerName = selectedPartner.Name,
            PartnerStreetAddress = selectedPartner.StreetAddress,
            PartnerPostalCode = selectedPartner.PostalCode,
            PartnerCity = selectedPartner.City,
            PartnerCountry = selectedPartner.Country
        };

        var depositsTo = await dbContext.Movements
            .Where(m =>m.Partner != null && m.Partner.Id == selectedPartner.Id &&
                       m.DecrementReasonCode == "OUT05" &&
                       m.Specimen!.QuantityDeponatedTo > 0 &&
                       !dbContext.Movements.Any(returnM => 
                           returnM.SpecimenId == m.SpecimenId && 
                           string.Compare(returnM.Date, m.Date) > 0))
            .Include(m => m.Specimen)
                .ThenInclude(s => s!.TaxonomyHierarchyView)
            .Select(m => new DepositMovementDto
            {
                SpecimenId = m.SpecimenId,
                MovementDate = m.Date,
                Gender = m.Specimen!.GenderTypeCode,
                AccessionNumber = m.Specimen!.AccessionNumber,
                SpeciesNameLat = m.Specimen!.TaxonomyHierarchyView!.SpeciesNameLat,
                SpeciesNameCz = m.Specimen!.TaxonomyHierarchyView!.SpeciesNameCz
            })
            .OrderByDescending(d => d.MovementDate)
            .ToListAsync();

        depositDto.DepositsTo = depositsTo;

        var depositsFrom = await dbContext.Movements
            .Where(m =>m.Partner != null && m.Partner.Id == selectedPartner.Id &&
                       m.IncrementReasonCode == "IN05" &&
                       m.Specimen!.QuantityDeponatedFrom > 0 &&
                       !dbContext.Movements.Any(outM => 
                           outM.SpecimenId == m.SpecimenId && 
                           !string.IsNullOrEmpty(outM.DecrementReasonCode) &&
                           string.Compare(outM.Date, m.Date) > 0))
            .Include(m => m.Specimen)
                .ThenInclude(s => s!.TaxonomyHierarchyView)
            .Select(m => new DepositMovementDto
            {
                SpecimenId = m.SpecimenId,
                MovementDate = m.Date,
                Gender = m.Specimen!.GenderTypeCode,
                AccessionNumber = m.Specimen!.AccessionNumber,
                SpeciesNameLat = m.Specimen!.TaxonomyHierarchyView!.SpeciesNameLat,
                SpeciesNameCz = m.Specimen!.TaxonomyHierarchyView!.SpeciesNameCz
            })
            .OrderByDescending(d => d.MovementDate)
            .ToListAsync();

        depositDto.DepositsFrom = depositsFrom;

        var deposits = new List<DepositDto> { depositDto };

        var response = new ResponseDto(deposits);
        return TypedResults.Ok(
            CommonDtos.SuccessResult<ResponseDto>.FromItemAndFluentValidation(
                response,
                new FluentValidation.Results.ValidationResult()
            )
        );
    }
}
