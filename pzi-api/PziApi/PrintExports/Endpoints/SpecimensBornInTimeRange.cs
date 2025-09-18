using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.Globalization;

namespace PziApi.PrintExports.Endpoints;

public class SpecimensBornInTimeRange
{
  public record Request(bool Vertebrata, string DateFrom, string DateTo);

  public class SpecimenItem
  {
    public int? AccessionNumber { get; set; }
    public string? GenderTypeCode { get; set; }
    public string? BirthDate { get; set; }
    public string? StudBookName { get; set; }
    public string? Chip { get; set; }
    public string? Notch { get; set; }
    public string? RingNumber { get; set; }
    public string? RegistrationNumber { get; set; }
    public string? Name { get; set; }
    public int? QuantityInZoo { get; set; }
    public decimal? Price { get; set; }
    public string? OrganizationLevelName { get; set; }
  }

  public class SpeciesItem
  {
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public string? CiteTypeCode { get; set; }
    public IEnumerable<SpecimenItem> Specimens { get; set; } = [];
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<SpeciesItem[]>>, BadRequest<string>>> Handle(
        [FromBody] Request request,
        PziDbContext dbContext)
  {
    if (string.IsNullOrEmpty(request.DateFrom) || string.IsNullOrEmpty(request.DateTo))
    {
      return TypedResults.BadRequest("DateFrom and DateTo are required.");
    }

    var phylaIds = await dbContext.TaxonomyPhyla
          .Where(p => p.IsVertebrate == request.Vertebrata)
          .Select(p => p.Id)
          .ToArrayAsync();

    var birthResults = dbContext.Specimens
          .Where(s => s.BirthDate != null
                 && s.BirthDate.CompareTo(request.DateFrom) >= 0
                 && s.BirthDate.CompareTo(request.DateTo) <= 0
                 && s.BirthPlace != null
                 && s.BirthPlace.ToUpper() == "PRAHA")
          .Where(s => s.OutReasonCode == null)
          .Where(s => s.QuantityInZoo > 0)
          .Where(s => phylaIds.Contains(s.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylumId!.Value))
          .Select(s => new
          {
            s.AccessionNumber,
            s.GenderTypeCode,
            s.StudBookNumber,
            s.StudBookName,
            s.Name,
            s.RegistrationNumber,
            s.BirthDate,
            s.Chip,
            s.Notch,
            s.RingNumber,
            s.QuantityInZoo,
            s.Price,
            OrganizationLevelName = s.OrganizationLevel!.Name,

            s.SpeciesId,
            s.Species!.NameLat,
            s.Species.NameCz,
            s.Species.CiteTypeCode,
          })
          .ToList()
          .OrderBy(s => s.NameCz, StringComparer.Create(CultureInfo.CreateSpecificCulture("cs-CZ"), CompareOptions.StringSort))
          .ThenBy(s => s.NameLat)
          .ThenBy(s => s.AccessionNumber);

    var groupedResults = birthResults.GroupBy(br => new { br.NameLat, br.SpeciesId });

    var results = groupedResults
      .Select((gr) =>
      {
        var firstSpecimen = gr.First();

        var specimens = gr
          .Select(r =>
          {
            return new SpecimenItem
            {
              AccessionNumber = r.AccessionNumber,
              GenderTypeCode = r.GenderTypeCode,
              BirthDate = r.BirthDate,
              StudBookName = r.StudBookName,
              Notch = string.IsNullOrEmpty(r.Notch) ? "" : r.Notch.Trim(),
              Chip = string.IsNullOrEmpty(r.Chip) ? "" : r.Chip.Trim(),
              RingNumber = string.IsNullOrEmpty(r.RingNumber) ? "" : r.RingNumber.Trim(),
              RegistrationNumber = r.RegistrationNumber,
              QuantityInZoo = r.QuantityInZoo,
              Price = r.Price,
              Name = r.Name,
              OrganizationLevelName = r.OrganizationLevelName
            };
          }).ToArray();

        return new SpeciesItem
        {
          NameCz = firstSpecimen.NameCz,
          NameLat = firstSpecimen.NameLat,
          CiteTypeCode = firstSpecimen.CiteTypeCode,
          Specimens = specimens
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
