using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Settings;
using PziApi.Models.Journal;

namespace PziApi.JournalEntries.Endpoints;

public class ActionTypesForUser
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.JournalActionTypeItem[]>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      Dtos.JournalActionTypesForUserRequest request,
      PziDbContext dbContext,
      IOptions<PermissionOptions> permissionOptions)
  {
    var user = await dbContext.Users
        .Include(u => u.UserRoles)
        .FirstOrDefaultAsync(u => u.UserName == request.UserName);

    var userRoleNames = user!.UserRoles?.Select(r => r.RoleName).ToList() ?? [];

    bool hasGlobalAccess = permissionOptions.Value.GrantAllPermissions ||
    userRoleNames.Any(role => permissionOptions.Value.DocumentationDepartment.Contains(role));

    var writeableOrgLevelIds = await dbContext.OrganizationLevels
        .Include(ol => ol.Parent!.Parent)
        .Where(ol => userRoleNames.Contains(ol.JournalApproversGroup!)
            || userRoleNames.Contains(ol.JournalContributorGroup!)
            || userRoleNames.Contains(ol.Parent!.JournalApproversGroup!)
            || userRoleNames.Contains(ol.Parent.JournalContributorGroup!)
            || userRoleNames.Contains(ol.Parent.Parent!.JournalApproversGroup!)
            || userRoleNames.Contains(ol.Parent.Parent!.JournalContributorGroup!))
        .Select(ol => ol.Id)
        .ToArrayAsync();

    var allActionTypes = await dbContext.JournalActionTypes
          .Include(at => at.OrganizationLevels)
          .OrderBy(at => at.Sort)
          .ToArrayAsync();

    var resultActionTypes = allActionTypes
          .Select(at => new Dtos.JournalActionTypeItem(
            at.Code,
            at.JournalEntryType,
            at.Sort,
            at.DisplayName,
            at.Note,
            hasGlobalAccess || (at.OrganizationLevels ?? Enumerable.Empty<JournalActionTypesToOrganizationLevels>()).Any(atol => writeableOrgLevelIds.Contains(atol.OrganizationLevelId))
          ))
          .ToArray();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.JournalActionTypeItem[]>.FromItem(resultActionTypes)
    );
  }
}
