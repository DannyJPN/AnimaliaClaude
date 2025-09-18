using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Settings;
using PziApi.Models.Journal;

namespace PziApi.JournalEntries.Endpoints;

public class DistrictsForUser
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.DistrictItem[]>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      Dtos.JournalActionTypesForUserRequest request,
      PziDbContext dbContext,
      IOptions<PermissionOptions> permissionOptions)
  {
    var user = await dbContext.Users
        .Include(u => u.UserRoles)
        .Include(u => u.FlaggedDistricts)
        .FirstOrDefaultAsync(u => u.UserName == request.UserName);

    var userRoleNames = user!.UserRoles?.Select(r => r.RoleName).ToList() ?? [];

    bool hasGlobalAccess = permissionOptions.Value.GrantAllPermissions ||
    userRoleNames.Any(role => permissionOptions.Value.DocumentationDepartment.Contains(role));

    Dtos.DistrictItem[] districts;

    if (hasGlobalAccess)
    {
      districts = await dbContext.OrganizationLevels
              .Where(e => e.Level == "district")
              .OrderBy(e => e.Name)
              .Select(e => new Dtos.DistrictItem(e.Id, e.Name, e.Level))
              .ToArrayAsync();
    }
    else
    {
      var flaggedDistrictIds = (user.FlaggedDistricts ?? [])
            .Select(e => e.DistrictId)
            .ToArray();

      districts = await dbContext.OrganizationLevels
            .Where(ol => userRoleNames.Contains(ol.JournalApproversGroup!)
              || userRoleNames.Contains(ol.JournalContributorGroup!)
              || userRoleNames.Contains(ol.Parent!.JournalApproversGroup!)
              || userRoleNames.Contains(ol.Parent.JournalContributorGroup!)
              || userRoleNames.Contains(ol.Parent.Parent!.JournalApproversGroup!)
              || userRoleNames.Contains(ol.Parent.Parent!.JournalContributorGroup!)
              || flaggedDistrictIds.Contains(ol.Id))
            .Where(ol => ol.Level == "district")
            .OrderBy(ol => ol.Name)
            .Select(e => new Dtos.DistrictItem(e.Id, e.Name, e.Level))
            .ToArrayAsync();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.DistrictItem[]>.FromItem(districts)
    );
  }
}
