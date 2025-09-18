using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;

namespace PziApi.Search.Endpoints;

public static class SpeciesSearch
{
  public record TaxonomyNode(
      int Id,
      string? NameLat,
      string? NameCz
  );

  public record TaxonomyClass : TaxonomyNode
  {
    public TaxonomyClass(int id, string? nameLat, string? nameCz) : base(id, nameLat, nameCz) { }
  }

  public record TaxonomyOrder : TaxonomyNode
  {
    public TaxonomyOrder(int id, string? nameLat, string? nameCz, TaxonomyClass taxonomyClass)
        : base(id, nameLat, nameCz)
    {
      TaxonomyClass = taxonomyClass;
    }

    public TaxonomyClass TaxonomyClass { get; }
  }

  public record TaxonomyFamily : TaxonomyNode
  {
    public TaxonomyFamily(int id, string? nameLat, string? nameCz, TaxonomyOrder order)
        : base(id, nameLat, nameCz)
    {
      TaxonomyOrder = order;
    }

    public TaxonomyOrder TaxonomyOrder { get; }
  }

  public record TaxonomyGenus : TaxonomyNode
  {
    public TaxonomyGenus(int id, string? nameLat, string? nameCz, TaxonomyFamily family)
        : base(id, nameLat, nameCz)
    {
      TaxonomyFamily = family;
    }

    public TaxonomyFamily TaxonomyFamily { get; }
  }

  public record SpeciesSearchResult(
      int Id,
      string? NameLat,
      string? NameCz,
      string? NameEn,
      string? NameGe,
      string? NameSk,
      string? Code,
      string? RdbCode,
      string? CiteTypeCode,
      string? ProtectionTypeCode,
      bool? IsEep,
      bool? IsEsb,
      bool? IsIsb,
      bool? IsGenePool,
      string ClassificationTypeCode,
      string? ZooStatus,
      decimal? Price,
      int? RegionId,
      string? Note,
      string? Synonyms,
      string? Description,
      string? FeedingRate,
      string? UcszCoef,
      string? EuCode,
      bool? IsRegulationRequirement,
      string? GroupType,
      bool? IsEuFauna,
      string? EuFaunaRefNumber,
      string? CrExceptionRefNumber,
      string? RdbCodePrevious,
      string? AvgMinDepositInk,
      string? AvgMaxDepositInk,
      string? AvgDurationInk,
      int? GroupId,
      string? Documentation,
      char SourceType,
      string? ModifiedBy,
      DateTime? ModifiedAt,
      int QuantityOwned,
      int QuantityInZoo,
      int QuantityDeponatedFrom,
      int QuantityDeponatedTo,
      TaxonomyGenus TaxonomyGenus
  );

  public class Request
  {
    public string SearchText { get; set; } = string.Empty;
    public bool SearchNameLat { get; set; } = true;
    public bool SearchNameCz { get; set; } = true;
    public string[]? ZooStatusCodes { get; set; }
  }

  public static async Task<Results<Ok<CommonDtos.SuccessResult<IEnumerable<SpeciesSearchResult>>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      [FromBody] Request request,
      PziDbContext dbContext
      )
  {
    var maxItems = 150;

    if (string.IsNullOrWhiteSpace(request.SearchText))
    {
      return TypedResults.BadRequest(CommonDtos.ValidationErrors.Single("SearchText", ErrorCodes.ERR_EMPTY, "SearchText cannot be empty"));
    }

    if (!request.SearchNameLat && !request.SearchNameCz)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("", ErrorCodes.ERR_EMPTY, "At least one of SearchNameLat or SearchNameCz has to be filled")
      );
    }

    var searchTerm = $"%{request.SearchText.ToLower()}%";

    // Get matching IDs with ordering
    var query = dbContext.Species
        .Where(s =>
            (request.SearchNameLat && EF.Functions.Like(s.NameLat!.ToLower(), searchTerm)) ||
            (request.SearchNameCz && EF.Functions.Like(s.NameCz!.ToLower(), searchTerm)));

    // Apply ZooStatus filter if provided
    if (request.ZooStatusCodes != null && request.ZooStatusCodes.Length > 0)
    {
      query = query.Where(s => request.ZooStatusCodes.Contains(s.ZooStatus));
    }

    var matchingIds = await query
        .OrderBy(s => request.SearchNameLat ? s.NameLat : s.NameCz)
        .Select(s => s.Id)
        .Take(maxItems)
        .ToListAsync();

    // Then get full details for matched IDs
    var results = await dbContext.Species
        .Where(s => matchingIds.Contains(s.Id))
        .Select(s => new SpeciesSearchResult(
            s.Id,
            s.NameLat,
            s.NameCz,
            s.NameEn,
            s.NameGe,
            s.NameSk,
            s.Code,
            s.RdbCode,
            s.CiteTypeCode,
            s.ProtectionTypeCode,
            s.IsEep,
            s.IsEsb,
            s.IsIsb,
            s.IsGenePool,
            s.ClassificationTypeCode,
            s.ZooStatus,
            s.Price,
            s.RegionId,
            s.Note,
            s.Synonyms,
            s.Description,
            s.FeedingRate,
            s.UcszCoef,
            s.EuCode,
            s.IsRegulationRequirement,
            s.GroupType,
            s.IsEuFauna,
            s.EuFaunaRefNumber,
            s.CrExceptionRefNumber,
            s.RdbCodePrevious,
            s.AvgMinDepositInk,
            s.AvgMaxDepositInk,
            s.AvgDurationInk,
            s.GroupId,
            s.Documentation,
            s.SourceType,
            s.ModifiedBy,
            s.ModifiedAt,
            s.QuantityOwned,
            s.QuantityInZoo,
            s.QuantityDeponatedFrom,
            s.QuantityDeponatedTo,
            new TaxonomyGenus(
                s.TaxonomyGenus!.Id,
                s.TaxonomyGenus.NameLat,
                s.TaxonomyGenus.NameCz,
                new TaxonomyFamily(
                    s.TaxonomyGenus.TaxonomyFamily!.Id,
                    s.TaxonomyGenus.TaxonomyFamily.NameLat,
                    s.TaxonomyGenus.TaxonomyFamily.NameCz,
                    new TaxonomyOrder(
                        s.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder!.Id,
                        s.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.NameLat,
                        s.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.NameCz,
                        new TaxonomyClass(
                            s.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass!.Id,
                            s.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass.NameLat,
                            s.TaxonomyGenus.TaxonomyFamily.TaxonomyOrder.TaxonomyClass.NameCz
                        )
                    )
                )
            )
        ))
        .ToListAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<IEnumerable<SpeciesSearchResult>>.FromItem(results)
    );
  }
}
