// Sestavy / Ekonomika - Inventura useku
// Sestavy / Ekonomika - Inventura rajonu
// Sestavy / Ekonomika - Inventura po rajonech

using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.PrintExports.Endpoints;

public class RegionInventory
{
  public record Request(int? OrgLevelId, string Date, string Mode, bool IsVertebrate);

  public class RegionDto
  {
    public int Id { get; set; }
    public string? Code { get; set; }
    public string RegionName { get; set; } = null!;
    public string? SectionName { get; set; }
    public int TotalLivingM { get; set; } = 0;
    public int TotalLivingF { get; set; } = 0;
    public int TotalLivingU { get; set; } = 0;
    public decimal SumPrice { get; set; } = 0;
    public ICollection<ClassDto> Classes { get; set; } = null!;
  }

  public class ClassDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public int SubLivingM { get; set; } = 0;
    public int SubLivingF { get; set; } = 0;
    public int SubLivingU { get; set; } = 0;
    public decimal SumPrice { get; set; } = 0;
    public ICollection<SpeciesDto> Species { get; set; } = null!;
  }

  public class SpeciesDto
  {
    public int Id { get; set; }
    public string? NameCz { get; set; }
    public string? NameLat { get; set; }
    public int LivingM { get; set; } = 0;
    public int LivingF { get; set; } = 0;
    public int LivingU { get; set; } = 0;
    public decimal SumPrice { get; set; } = 0;
  }

  public class RequestValidator : AbstractValidator<Request>
  {
    public RequestValidator()
    {
      RuleFor(x => x.Date)
        .NotEmpty()
        .Must(DateTimeHelpers.IsValidFullDateString)
        .WithErrorCode(ErrorCodes.ERR_INVALID_VALUE)
        .WithMessage("Date is not valid date (yyyy/MM/dd).");
    }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<RegionDto[]>>, NotFound, BadRequest<CommonDtos.ValidationErrors>>> Handle(
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

    if (!Enum.TryParse<OrganizationInventoryModeEnum>(request.Mode, true, out var mode))
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("mode", ErrorCodes.ERR_INVALID_VALUE, "Invalid mode")
      );
    }

    var specimens = dbContext.Specimens
        .Where(s => s.TaxonomyHierarchyView!.IsVertebrate == request.IsVertebrate)
        // NOTE: this is probably not correct in currect implementation, since now district is not required for specimen
        .Where(s => s.OrgHierarchyView!.DistrictId.HasValue)
        .Where(s => string.Compare(s.InDate, request.Date) <= 0)
        .Where(s => string.IsNullOrWhiteSpace(s.OutDate) || string.Compare(s.OutDate, request.Date) > 0)
        .Select(s => new
        {
          DistrictId = s.OrgHierarchyView!.DistrictId,
          DistrictName = s.OrgHierarchyView!.DistrictName,
          DepartmentId = s.OrgHierarchyView!.DepartmentId,
          DepartmentName = s.OrgHierarchyView!.DepartmentName,
          SpeciesId = s.SpeciesId,
          SpeciesNameCz = s.TaxonomyHierarchyView!.SpeciesNameCz,
          SpeciesNameLat = s.TaxonomyHierarchyView!.SpeciesNameCz,
          ClassId = s.TaxonomyHierarchyView!.ClassId,
          ClassNameLat = s.TaxonomyHierarchyView!.ClassNameLat,
          ClassNameCz = s.TaxonomyHierarchyView!.ClassNameCz,
          GenderTypeCode = s.GenderTypeCode,
          InDate = s.InDate,
          OutDate = s.OutDate,
          QuantityInZoo = s.QuantityInZoo,
          Price = s.Price
        });

    if (request.OrgLevelId.HasValue)
    {
      specimens = mode == OrganizationInventoryModeEnum.Region
        ? specimens.Where(s => s.DistrictId == request.OrgLevelId)
        : specimens.Where(s => s.DepartmentId == request.OrgLevelId);
    }

    var specimensInDistricts = await specimens
        .GroupBy(s => s.DistrictId)
        .ToDictionaryAsync(s => s.Key, s => s.GroupBy(sp => sp.ClassId).ToDictionary(c => c.Key, c => c.ToList()));

    if (!specimens.Any())
    {

      return TypedResults.Ok(
          CommonDtos.SuccessResult<RegionDto[]>.FromItemAndFluentValidation(
              Array.Empty<RegionDto>(),
              new FluentValidation.Results.ValidationResult()
          )
      );
    }

    var regions = new List<RegionDto>();
    foreach (var district in specimensInDistricts)
    {
      var classInDistrict = new List<ClassDto>();
      foreach (var specimensInClass in district.Value)
      {
        var speciesInDistrict = new List<SpeciesDto>();
        var speciesGroups = specimensInClass.Value.GroupBy(s => s.SpeciesId);
        foreach (var speciesGroup in speciesGroups)
        {
          var livingM = speciesGroup
            .Where(sp => sp.GenderTypeCode == "M")
            .Sum(sp => sp.QuantityInZoo);
          var livingF = speciesGroup
            .Where(sp => sp.GenderTypeCode == "F")
            .Sum(sp => sp.QuantityInZoo);
          var livingU = speciesGroup
            .Where(sp => sp.GenderTypeCode == "U")
            .Sum(sp => sp.QuantityInZoo);
          var priceSum = speciesGroup
            .Sum(sp => sp.Price ?? 0m);

          // every specimen in species group has same species
          var specimen = speciesGroup.First();

          speciesInDistrict.Add(new SpeciesDto
          {
            Id = speciesGroup.Key,
            LivingF = livingF,
            LivingM = livingM,
            LivingU = livingU,
            SumPrice = priceSum,
            NameCz = specimen.SpeciesNameCz,
            NameLat = specimen.SpeciesNameLat,
          });
        }

        classInDistrict.Add(new ClassDto
        {
          Id = specimensInClass.Key,
          NameCz = specimensInClass.Value.First().ClassNameCz,
          NameLat = specimensInClass.Value.First().ClassNameLat,
          SubLivingF = speciesInDistrict.Sum(c => c.LivingF),
          SubLivingM = speciesInDistrict.Sum(c => c.LivingM),
          SubLivingU = speciesInDistrict.Sum(c => c.LivingU),
          SumPrice = speciesInDistrict.Sum(c => c.SumPrice),
          Species = speciesInDistrict.OrderBy(s => s.NameCz).ToArray()
        });
      }

      var districtData = district.Value.Select(s => s.Value.First()).First();
      regions.Add(new RegionDto
      {

        Id = districtData.DistrictId!.Value,
        RegionName = districtData!.DistrictName!,
        SectionName = districtData!.DepartmentName,
        Code = "",
        TotalLivingF = classInDistrict.Sum(c => c.SubLivingF),
        TotalLivingM = classInDistrict.Sum(c => c.SubLivingM),
        TotalLivingU = classInDistrict.Sum(c => c.SubLivingU),
        SumPrice = classInDistrict.Sum(c => c.SumPrice),
        Classes = classInDistrict.OrderBy(c => c.NameCz).ToArray()
      });
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<RegionDto[]>.FromItemAndFluentValidation(
            regions.OrderByDescending(r => r.RegionName).ToArray(),
            new FluentValidation.Results.ValidationResult()
          )
      );
  }
}