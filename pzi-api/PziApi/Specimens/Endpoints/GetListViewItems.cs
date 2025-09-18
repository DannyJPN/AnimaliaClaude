using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using System.Linq.Expressions;
using static PziApi.Specimens.Dtos;

namespace PziApi.Specimens.Endpoints;

public static class GetListViewItems
{
  private static IQueryable<Models.Specimen> ApplyFilters(IQueryable<Models.Specimen> query, Dtos.SpecimentsListViewRequest request)
  {
    if (request.Filtering.Count == 0)
    {
      return query;
    }

    foreach (var filter in request.Filtering)
    {
      switch (filter.FilterId.ToUpper())
      {
        case "SPECIESID":
          var speciesIds = filter.Values.Select(int.Parse).ToArray();
          query = query.Where(e => speciesIds.Contains(e.SpeciesId));
          break;
        case "GENUSID":
          var genusIds = filter.Values.Select(int.Parse).ToArray();
          query = query.Where(e => genusIds.Contains(e.Species!.TaxonomyGenusId));
          break;
        case "ORDERID":
          var orderIds = filter.Values.Select(int.Parse).ToArray();
          query = query.Where(e => orderIds.Contains(e.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrderId));
          break;
        case "FAMILYID":
          var familyIds = filter.Values.Select(int.Parse).ToArray();
          query = query.Where(e => familyIds.Contains(e.Species!.TaxonomyGenus!.TaxonomyFamilyId));
          break;
        case "CLASSID":
          var classIds = filter.Values.Select(int.Parse).ToArray();
          query = query.Where(e => classIds.Contains(e.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClassId));
          break;
        case "PHYLUMID":
          var phylumIds = filter.Values.Select(int.Parse).ToArray();
          query = query.Where(e => phylumIds.Contains(e.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylumId!.Value));
          break;
        case "SPECIESNAME":
          if (filter.Values.Length > 0)
          {
            var value = filter.Values[0];

            query = query.Where(e => e.Species!.NameLat!.Contains(value) || e.Species.NameCz!.Contains(value));
          }
          break;
        case "ZIMS":
          if (filter.Values.Length > 0)
          {
            var value = filter.Values[0];

            query = query.Where(e => e.Zims!.Contains(value));
          }
          break;
        case "MARKING":
          if (filter.Values.Length > 0)
          {
            var value = filter.Values[0];

            query = query.Where(e =>
              (e.Notch != null && e.Notch.Contains(value)) ||
              (e.Chip != null && e.Chip.Contains(value)) ||
              (e.RingNumber != null && e.RingNumber.Contains(value)) ||
              (e.OtherMarking != null && e.OtherMarking.Contains(value)));
          }
          break;
        case "DISTRICTID":
          var districtIds = filter.Values.Select(int.Parse).ToArray();

          query = query.Where(e => districtIds.Contains(e.OrgHierarchyView!.DistrictId!.Value));
          break;
        case "WORKPLACEID":
          var workplaceIds = filter.Values.Select(int.Parse).ToArray();

          query = query.Where(e => workplaceIds.Contains(e.OrgHierarchyView!.WorkplaceId!.Value));
          break;
        case "DEPARTMENTID":
          var departmentIds = filter.Values.Select(int.Parse).ToArray();

          query = query.Where(e => departmentIds.Contains(e.OrgHierarchyView!.DepartmentId!.Value));
          break;

        case "EXPOSITIONAREAID":
          var expAreaIds = filter.Values.Select(int.Parse).ToArray();

          query = query.Where(e => expAreaIds.Contains(e.ExpositionHierarchyView!.ExpositionAreaId!.Value));
          break;

        case "EXPOSITIONSETID":
          var expSetIds = filter.Values.Select(int.Parse).ToArray();

          query = query.Where(e => expSetIds.Contains(e.ExpositionHierarchyView!.ExpositionSetId!.Value));
          break;

        case "LOCATIONID":
          var locationIds = filter.Values.Select(int.Parse).ToArray();

          query = query.Where(e => locationIds.Contains(e.PlacementLocationId!.Value));
          break;

        default:
          break;
      }
    }

    return query;
  }


  public static async Task<Results<Ok<CommonDtos.SuccessResult<CommonDtos.PagedResult<Dtos.SpecimenGridItem>>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
    Dtos.SpecimentsListViewRequest request,
    PziDbContext dbContext)
  {
    var filteredIdsQuery = dbContext.Specimens.AsNoTracking();

    filteredIdsQuery = ApplyFilters(filteredIdsQuery, request);

    var totalCount = await filteredIdsQuery.CountAsync();

    filteredIdsQuery = ApplySort(filteredIdsQuery, request);

    var filteredIds = await filteredIdsQuery
      .Skip((request.Paging.PageIndex - 1) * request.Paging.PageSize)
      .Take(request.Paging.PageSize)
      .Select(s => s.Id)
      .ToArrayAsync();

    var itemsQuery = dbContext.Specimens.AsNoTracking()
      .Where(s => filteredIds.Contains(s.Id));

    itemsQuery = ApplySort(itemsQuery, request);

    var items = await itemsQuery
      .Select(s => new SpecimenGridItem(
                            s.Id,
                            s.AccessionNumber,
                            s.GenderTypeCode,
                            s.ClassificationTypeCode,
                            s.Zims,
                            s.StudBookNumber,
                            s.StudBookName,
                            s.Name,
                            s.Notch,
                            s.Chip,
                            s.RingNumber,
                            s.OtherMarking,
                            s.IsHybrid,
                            s.Location,
                            s.BirthDate,
                            s.BirthPlace,
                            s.BirthMethod,
                            s.Rearing,
                            s.FatherId,
                            s.MotherId,
                            s.Note,
                            s.OtherDetails,
                            s.RegisteredDate,
                            s.RegisteredTo,
                            s.RegistrationNumber,
                            s.CadaverDate,
                            s.CadaverPlace,
                            s.EuPermit,
                            s.CzechRegistrationNumber,
                            s.FatherZims,
                            s.MotherZims,
                            s.Documentation,
                            s.Ueln,
                            s.ModifiedBy,
                            s.ModifiedAt,
                            s.InDate,
                            s.InReasonCode,
                            s.InLocationId,
                            s.OutDate,
                            s.OutReasonCode,
                            s.OutLocationId,
                            s.Price,
                            s.QuantityOwned,
                            s.QuantityInZoo,
                            s.QuantityDeponatedFrom,
                            s.QuantityDeponatedTo,
                            s.PlacementLocationId,
                            s.OrganizationLevelId,
                            s.SpeciesId,
                            s.TaxonomyHierarchyView!.SpeciesNameCz,
                            s.TaxonomyHierarchyView!.SpeciesNameLat,

                            s.TaxonomyHierarchyView!.GenusId,
                            s.TaxonomyHierarchyView.GenusNameCz,
                            s.TaxonomyHierarchyView.GenusNameLat,

                            s.TaxonomyHierarchyView.FamilyId,
                            s.TaxonomyHierarchyView.FamilyNameCz,
                            s.TaxonomyHierarchyView.FamilyNameLat,

                            s.TaxonomyHierarchyView.OrderId,
                            s.TaxonomyHierarchyView.OrderNameCz,
                            s.TaxonomyHierarchyView.OrderNameLat,

                            s.TaxonomyHierarchyView.ClassId,
                            s.TaxonomyHierarchyView.ClassNameCz,
                            s.TaxonomyHierarchyView.ClassNameLat,

                            s.TaxonomyHierarchyView.PhylumId,
                            s.TaxonomyHierarchyView.PhylumNameCz,
                            s.TaxonomyHierarchyView.PhylumNameLat,

                            s.ExpositionHierarchyView!.LocationName,
                            s.ExpositionHierarchyView!.ExpositionSetId,
                            s.ExpositionHierarchyView!.ExpositionSetName,
                            s.ExpositionHierarchyView!.ExpositionAreaId,
                            s.ExpositionHierarchyView!.ExpositionAreaName,

                            s.OrgHierarchyView!.DistrictId,
                            s.OrgHierarchyView.DistrictName,
                            s.OrgHierarchyView.WorkplaceId,
                            s.OrgHierarchyView.WorkplaceName,
                            s.OrgHierarchyView.DepartmentId,
                            s.OrgHierarchyView.DepartmentName
                            ))
              .ToListAsync();

    var pagedResult = new CommonDtos.PagedResult<Dtos.SpecimenGridItem>(
          items,
          totalCount,
          request.Paging.PageIndex,
          request.Paging.PageSize
        );

    return TypedResults.Ok(
      CommonDtos.SuccessResult<CommonDtos.PagedResult<Dtos.SpecimenGridItem>>.FromItem(pagedResult)
    );
  }

  private static IQueryable<Models.Specimen> ApplySort(IQueryable<Models.Specimen> query, Dtos.SpecimentsListViewRequest request)
  {
    if (request.Sorting.Count == 0)
    {
      return query.OrderByDescending(e => e.ModifiedAt);
    }

    var sortId = request.Sorting[0].SortId.ToUpper();
    var ascending = request.Sorting[0].Dir == "A";

    var sortExpressions = new Dictionary<string, Expression<Func<Models.Specimen, object>>>(StringComparer.OrdinalIgnoreCase)
    {
      { "ID", e => e.Id },
      { "SPECIESID", e => e.SpeciesId },
      { "SPECIESNAMECZ", e => e.Species!.NameCz! },
      { "SPECIESNAMELAT", e => e.Species!.NameLat! },
      { "GENUSID", e => e.Species!.TaxonomyGenusId },
      { "ORDERID", e => e.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrderId },
      { "FAMILYID", e => e.Species!.TaxonomyGenus!.TaxonomyFamilyId },
      { "CLASSID", e => e.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClassId },
      { "PHYLUMID", e => e.Species!.TaxonomyGenus!.TaxonomyFamily!.TaxonomyOrder!.TaxonomyClass!.TaxonomyPhylumId! },
      { "NAME", e => e!.Name! },
      { "ZIMS", e => e!.Zims! },
      { "LOCATION", e => e!.Location! },
      { "BIRTHDATE", e => e!.BirthDate! },
      { "ACCESSIONNUMBER", e => e!.AccessionNumber! },
      { "GENDERTYPECODE", e => e!.GenderTypeCode! },
      { "MODIFIEDAT", e => e!.ModifiedAt! },
      { "QUANTITYOWNED", e => e!.QuantityOwned! },
      { "QUANTITYINZOO", e => e!.QuantityInZoo! },
      { "QUANTITYDEPONATEDFROM", e => e!.QuantityDeponatedFrom! },
      { "QUANTITYDEPONATEDTO", e => e!.QuantityDeponatedTo! }
    };

    // Apply the sort if we have a matching expression
    if (sortExpressions.TryGetValue(sortId, out var sortExpression))
    {
      return ascending
        ? query.OrderBy(sortExpression)
        : query.OrderByDescending(sortExpression);
    }

    // Default sort by modified date
    return query.OrderByDescending(e => e.ModifiedAt);
  }
}
