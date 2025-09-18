using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.Models;

namespace PziApi.PrintExports.Endpoints;

public class ZoologySpecimensForArksInTimeRange
{
  public record Request(string DateRange, bool IsVertebrate);

  public class Validator : AbstractValidator<Request>
    {
        public Validator()
        {
            RuleFor(x => x.DateRange).NotEmpty().WithErrorCode(ErrorCodes.ERR_EMPTY).WithMessage("DateRange is required.");
        }
    }

  public class SpecimenMovementItem
  {
    public string? Zims { get; set; }
    public string? BirthDate { get; set; }
    public string? BirthPlace { get; set; }
    public string? FatherZims { get; set; }
    public string? MotherZims { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? MovementDate { get; set; }
    public string? IncrementDisplayName { get; set; }
    public string? DecrementDisplayName { get; set; }
    public string? PartnerDisplayName { get; set; }
    public string? SpecimenName { get; set; }
    public string? StudBookName { get; set; }
    public string? SpecimenMarking { get; set; }
  }

  public class SpeciesItem
  {
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public IEnumerable<SpecimenMovementItem> Movements { get; set; } = [];
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesItem[]>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
        [FromBody] Request request,
        PziDbContext dbContext)
  {
    var validator = new Validator();
    var validationResult = await validator.ValidateAsync(request);

    if (!validationResult.IsValid)
    {
        return TypedResults.BadRequest(CommonDtos.ValidationErrors.FromFluentValidation(validationResult));
    }

    var phylaIds = await dbContext.TaxonomyPhyla
          .Where(p => p.IsVertebrate == request.IsVertebrate)
          .Select(p => p.Id)
          .ToArrayAsync();

    var movementResults = await dbContext.Movements
          .Include(m => m.Specimen!.TaxonomyHierarchyView)
          .Where(m => m.Specimen!.TaxonomyHierarchyView != null && phylaIds.Contains(m.Specimen.TaxonomyHierarchyView.PhylumId))
          .Where(m => m.Date.StartsWith(request.DateRange))
          .Where(m => !string.IsNullOrEmpty(m.Specimen!.Zims) && m.QuantityActual > 0)
          .Select(m => new
          {
            Zims = m.Specimen!.Zims,
            GenderTypeCode = m.Specimen.GenderTypeCode,
            StudBookName = m.Specimen.StudBookName,
            Name = m.Specimen.Name,
            BirthDate = m.Specimen.BirthDate,
            BirthPlace = m.Specimen.BirthPlace,
            SpeciesNameCz = m.Specimen!.Species!.NameCz,
            SpeciesNameLat = m.Specimen.Species.NameLat,
            SpeciesId = m.Specimen.SpeciesId,
            Date = m.Date,
            IncrementReason = m.IncrementReason,
            DecrementReason = m.DecrementReason,
            FatherZims = m.Specimen.FatherZims,
            MotherZims = m.Specimen.MotherZims,
            Partner = m.Partner,
            OtherMarking = m.Specimen.OtherMarking,
            Chip = m.Specimen.Chip,
            RingNumber = m.Specimen.RingNumber,
          })
          .OrderBy(m => m.SpeciesNameLat)
          .ThenBy(m => m.Zims)
          .ThenBy(m => m.Date)
          .ToArrayAsync();

    var grouppedResults = movementResults.GroupBy(mr => new { mr.SpeciesNameLat, mr.SpeciesId });

    var results = grouppedResults
      .Select((gr) =>
      {
        var speciesNameCz = gr.First().SpeciesNameCz;
        var speciesNameLat = gr.First().SpeciesNameLat;

        var movements = gr
          .Select(r =>
        {
          return new SpecimenMovementItem
          {
            Zims = r.Zims,
            BirthDate = r.BirthDate,
            BirthPlace = r.BirthPlace,
            DecrementDisplayName = r.DecrementReason?.DisplayName,
            FatherZims = r.FatherZims,
            MotherZims = r.MotherZims,
            GenderTypeCode = r.GenderTypeCode,
            IncrementDisplayName = r.IncrementReason?.DisplayName,
            MovementDate = r.Date,
            PartnerDisplayName = r.Partner?.Keyword,
            SpecimenMarking = string.IsNullOrEmpty(r.Chip)
              ? r.RingNumber
              : r.Chip,
            SpecimenName = r.Name,
            StudBookName = r.StudBookName
          };
        }).ToArray();

        return new SpeciesItem
        {
          NameCz = speciesNameCz,
          NameLat = speciesNameLat,
          Movements = movements
        };
      }).ToArray();

    return TypedResults.Ok(
        CommonDtos.SuccessResult<SpeciesItem[]>.FromItemAndFluentValidation(
            results,
            new FluentValidation.Results.ValidationResult()
        )
    );

  }
}
