using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Settings;

namespace PziApi.JournalCommon.Endpoints;

public class SpeciesForUser
{
  public class SpeciesForUserRequest
  {
    public string? UserName { get; set; }
  }

  public record SpeciesItem(
    int Id,
    string? NameLat,
    string? NameCz
  );

  public static async Task<Results<Ok<CommonDtos.SuccessResult<IEnumerable<SpeciesItem>>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
    SpeciesForUserRequest request,
    PziDbContext dbContext,
    IOptions<PermissionOptions> permissionOptions)
  {
    var user = await dbContext.Users
      .Include(u => u.UserRoles)
      .FirstOrDefaultAsync(u => u.UserName == request.UserName);

    if (user == null)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("userName", ErrorCodes.ERR_INVALID_VALUE, "Invalid user name")
      );
    }

    var userRoleNames = user.UserRoles?.Select(r => r.RoleName).ToList() ?? [];
    
    bool hasGlobalAccess = permissionOptions.Value.GrantAllPermissions ||
        userRoleNames.Any(role => 
        permissionOptions.Value.DocumentationDepartment.Contains(role) || 
        permissionOptions.Value.JournalRead.Contains(role));

    var accesibleOrgLevels = await dbContext.OrganizationLevels
      .Include(ol => ol.Parent!.Parent)
      .Where(ol => userRoleNames.Contains(ol.JournalApproversGroup!)
        || userRoleNames.Contains(ol.JournalContributorGroup!)
        || userRoleNames.Contains(ol.JournalReadGroup!)
        || userRoleNames.Contains(ol.Parent!.JournalApproversGroup!)
        || userRoleNames.Contains(ol.Parent.JournalContributorGroup!)
        || userRoleNames.Contains(ol.Parent.JournalReadGroup!)
        || userRoleNames.Contains(ol.Parent.Parent!.JournalApproversGroup!)
        || userRoleNames.Contains(ol.Parent.Parent!.JournalContributorGroup!)
        || userRoleNames.Contains(ol.Parent.Parent!.JournalReadGroup!))
      .ToArrayAsync();

    var accesibleOrgLevelIds = accesibleOrgLevels.Select(ol => ol.Id).ToArray();

    var speciesQuery = dbContext.Species
        .Where(s => s.ZooStatus != ZooStatusCodes.NO_EVIDENCE);
        
    if (!hasGlobalAccess)
    {
        speciesQuery = speciesQuery.Where(s => 
            s.Specimens!.Any(sp => sp.OrganizationLevelId != null && accesibleOrgLevelIds.Contains(sp.OrganizationLevelId.Value)));
    }
    
    var speciesList = await speciesQuery
        .OrderBy(s => s.NameLat)
        .ToArrayAsync();

    var mappedItems = speciesList
        .Select(s => new SpeciesItem(
          Id: s.Id,
          NameLat: s.NameLat,
          NameCz: s.NameCz
        ))
        .ToArray();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<IEnumerable<SpeciesItem>>.FromItem(mappedItems)
    );
  }
}
