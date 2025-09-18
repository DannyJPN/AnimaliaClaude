using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Journal;
using PziApi.CrossCutting.Settings;
using static PziApi.CrossCutting.CommonDtos;

namespace PziApi.JournalEntries.Endpoints;

public static class EntriesForUser
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<CommonDtos.PagedResult<Dtos.JournalEntryGridItem>>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      Dtos.EntriesForUserRequest request,
      PziDbContext dbContext,
      IOptions<PermissionOptions> permissionOptions)
  {
    var user = await dbContext.Users
        .Include(u => u.UserRoles)
        .FirstOrDefaultAsync(u => u.UserName == request.UserName);

    if (user == null)
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single("userName", ErrorCodes.ERR_INVALID_VALUE, ErrorMessageProvider.GetMessage(ErrorCodes.ERR_INVALID_VALUE))
      );
    }

    var (entryActionsResolver, accessibleOrgLevelIds, hasGlobalAccess) = await JournalEntryActionResolver.PrepareJournalEntryActionResolver(dbContext, user, permissionOptions);

#nullable disable
    var query = dbContext.JournalEntries
        .Include(x => x.OrganizationLevel)
        .Include(x => x.Species)
        .Include(x => x.ActionType)
        .Include(x => x.Specimens)
          .ThenInclude(x => x.Specimen)
        .Include(x => x.Specimens)
          .ThenInclude(x => x.Attributes!)
        .Include(x => x.Attributes)
        .Where(x => !x.IsDeleted)
        .AsNoTracking();
#nullable restore

    if (!hasGlobalAccess)
    {
      query = query.Where(e => accessibleOrgLevelIds.Contains(e.OrganizationLevelId) || e.AuthorName == request.UserName);
    }

    foreach (var filter in request.Filtering.Where(f => !string.IsNullOrWhiteSpace(f.FilterId) && f.Values != null && f.Values.Any()))
    {
      query = filter.FilterId.ToLower() switch
      {
        "id" => FilterByIds(query, filter),
        "authorname" => query.Where(x => x.AuthorName == filter.Values.First()),
        "organizationlevelid" => FilterByOrgLevelIds(query, filter),
        "speciesid" => FilterBySpeciesIds(query, filter),
        "entrytype" => query.Where(x => filter.Values.Contains(x.EntryType)),
        "actiontypecode" => query.Where(x => filter.Values.Contains(x.ActionTypeCode)),
        "status" => query.Where(x => filter.Values.Contains(x.Status)),
        "createdby" => query.Where(x => filter.Values.Contains(x.CreatedBy)),
        "reviewedby" => query.Where(x => filter.Values.Contains(x.ReviewedBy)),
        "archivereviewedby" => query.Where(x => filter.Values.Contains(x.ArchiveReviewedBy)),
        "specimenid" => FilterBySpecimenIds(query, filter),
        _ => query
      };
    }

    var sorting = request.Sorting == null ? new Sorting("ENTRYDATE", "D") : request.Sorting.Where(s => !string.IsNullOrWhiteSpace(s.SortId) && !string.IsNullOrWhiteSpace(s.Dir)).FirstOrDefault();
    if (sorting != null)
    {
      query = sorting.SortId.ToUpper() switch
      {
        "ID" => sorting.Dir == "A"
           ? query.OrderBy(x => x.Id)
           : query.OrderByDescending(x => x.Id),
        "AUTHORNAME" => sorting.Dir == "A"
           ? query.OrderBy(x => x.AuthorName)
           : query.OrderByDescending(x => x.AuthorName),
        "ENTRYDATE" => sorting.Dir == "A"
            ? query.OrderBy(x => x.EntryDate)
            : query.OrderByDescending(x => x.EntryDate),
        "CREATEDAT" => sorting.Dir == "A"
            ? query.OrderBy(x => x.CreatedAt)
            : query.OrderByDescending(x => x.CreatedAt),
        "MODIFIEDAT" => sorting.Dir == "A"
            ? query.OrderBy(x => x.ModifiedAt)
            : query.OrderByDescending(x => x.ModifiedAt),
        "REVIEWEDAT" => sorting.Dir == "A"
            ? query.OrderBy(x => x.ReviewedAt)
            : query.OrderByDescending(x => x.ReviewedAt),
        "ARCHIVEREVIEWEDAT" => sorting.Dir == "A"
            ? query.OrderBy(x => x.ArchiveReviewedAt)
            : query.OrderByDescending(x => x.ArchiveReviewedAt),
        "ORGANIZATIONLEVELNAME" => sorting.Dir == "A"
            ? query.OrderBy(x => x.OrganizationLevel!.Name)
            : query.OrderByDescending(x => x.OrganizationLevel!.Name),
        "SPECIESNAMELAT" => sorting.Dir == "A"
            ? query.OrderBy(x => x.Species!.NameLat)
            : query.OrderByDescending(x => x.Species!.NameLat),
        "SPECIESNAMECZ" => sorting.Dir == "A"
            ? query.OrderBy(x => x.Species!.NameCz)
            : query.OrderByDescending(x => x.Species!.NameCz),
        "STATUS" => sorting.Dir == "A"
            ? query.OrderBy(x => x.Status)
            : query.OrderByDescending(x => x.Status),
        _ => query.OrderByDescending(x => x.EntryDate)
      };
    }

    var totalCount = await query.CountAsync();

    query = query
        .Skip((request.Paging.PageIndex - 1) * request.Paging.PageSize)
        .Take(request.Paging.PageSize);

    var pagedEntries = await query.ToListAsync();

    var mappedEntries = pagedEntries.Select(x => new Dtos.JournalEntryGridItem(
        x.Id,
        x.AuthorName,
        x.CreatedBy,
        x.CreatedAt,
        x.OrganizationLevelId,
        x.OrganizationLevel!.Name,
        x.SpeciesId,
        x.Species!.NameLat,
        x.Species.NameCz,
        x.EntryDate.ToString("yyyy/MM/dd"),
        x.EntryType,
        x.ActionTypeCode,
        x.ActionType!.DisplayName,
        x.Status,
        x.Note,
        x.IsDeleted,
        x.ModifiedBy,
        x.ModifiedAt,
        x.ReviewedBy,
        x.ReviewedAt,
        x.CuratorReviewNote,
        x.ArchiveReviewedBy,
        x.ArchiveReviewedAt,
        x.ArchiveReviewNote,
        x.Attributes != null
          ? x.Attributes.Select(a => new Dtos.AttributeItem(a.AttributeTypeCode, a.AttributeValue)).ToList()
          : Enumerable.Empty<Dtos.AttributeItem>(),
        x.Specimens != null
          ? x.Specimens.Select(s => new Dtos.JournalSpecimenDetailItem(
            s.Id,
            s.SpecimenId,
            s.Specimen!.AccessionNumber,
            s.Specimen.BirthDate,
            s.Specimen.Zims,
            s.Specimen.Name,
            s.Specimen.GenderTypeCode,
            s.Note,
            s.Attributes != null ? s.Attributes.Select(a => new Dtos.AttributeItem(a.AttributeTypeCode, a.AttributeValue)).ToList() : null
          ))
          : Enumerable.Empty<Dtos.JournalSpecimenDetailItem>(),
        entryActionsResolver.GetActions(x)
    )).ToList();

    var pagedResult = new CommonDtos.PagedResult<Dtos.JournalEntryGridItem>(
        mappedEntries,
        totalCount,
        request.Paging.PageIndex,
        request.Paging.PageSize
    );

    return TypedResults.Ok(
        CommonDtos.SuccessResult<CommonDtos.PagedResult<Dtos.JournalEntryGridItem>>.FromItem(pagedResult)
    );
  }

  private static IQueryable<Models.Journal.JournalEntry> FilterBySpecimenIds(IQueryable<Models.Journal.JournalEntry> query, Filtering filter)
  {
    var specimenIds = filter.Values.Select(int.Parse).ToArray();

    return query.Where(e => e.Specimens!.Any(s => specimenIds.Contains(s.Id)));
  }

  private static IQueryable<Models.Journal.JournalEntry> FilterBySpeciesIds(IQueryable<Models.Journal.JournalEntry> query, Filtering filter)
  {
    var speciesIds = filter.Values.Select(int.Parse).ToArray();

    return query.Where(e => speciesIds.Contains(e.SpeciesId));
  }

  private static IQueryable<Models.Journal.JournalEntry> FilterByIds(IQueryable<Models.Journal.JournalEntry> query, Filtering filter)
  {
    var ids = filter.Values.Select(int.Parse).ToArray();

    return query.Where(e => ids.Contains(e.Id));
  }

  private static IQueryable<Models.Journal.JournalEntry> FilterByOrgLevelIds(IQueryable<Models.Journal.JournalEntry> query, Filtering filter)
  {
    var ids = filter.Values.Select(int.Parse).ToArray();

    return query.Where(e => ids.Contains(e.OrganizationLevelId));
  }
}
