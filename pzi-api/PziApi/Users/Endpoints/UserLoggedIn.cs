using FluentValidation.Results;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Permissions;
using PziApi.CrossCutting.Settings;
using PziApi.Models;

namespace PziApi.Users.Endpoints;

public class UserLoggedIn
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.UserSettingsModel>>, BadRequest>> Handle([FromBody] Dtos.UserLoggedInRequest viewModel, PziDbContext dbContext, IOptions<PermissionOptions> permissionOptions)
  {
    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.UserName == viewModel.UserName);

    if (user == null)
    {
      user = new Models.User()
      {
        UserName = viewModel.UserName,
        TaxonomySearchByLat = true,
        TaxonomySearchByCz = false
      };

      dbContext.Users.Add(user);

      await dbContext.SaveChangesAsync();
    }

    var existingRoles = await dbContext.UserRoles
        .Where(r => r.User!.UserName == viewModel.UserName)
        .ToArrayAsync();

    var newRoles = viewModel.Roles
      .Where(r => !existingRoles.Any(ur => ur.RoleName == r))
      .Select(r => new UserRole()
      {
        RoleName = r,
        UserId = user.Id
      })
      .ToArray();

    var rolesToDrop = existingRoles
      .Where(ur => !viewModel.Roles.Any(r => ur.RoleName == r))
      .ToArray();

    dbContext.UserRoles.RemoveRange(rolesToDrop);
    dbContext.UserRoles.AddRange(newRoles);

    await dbContext.SaveChangesAsync();

    string visibleStatuses = string.IsNullOrEmpty(user.VisibleTaxonomyStatuses)
      ? "A,D,N,Z"!
      : user.VisibleTaxonomyStatuses;

    var hasJournalEditRoleInOrgLevels = await dbContext.OrganizationLevels.AnyAsync(ol =>
          viewModel.Roles.Contains(ol.JournalApproversGroup!) ||
          viewModel.Roles.Contains(ol.JournalContributorGroup!));

    var hasJournalReadRoleInOrgLevels = await dbContext.OrganizationLevels.AnyAsync(ol => viewModel.Roles.Contains(ol.JournalReadGroup!));

    var userPermissions = DetermineUserPermissions(
      userName: viewModel.UserName,
      roles: viewModel.Roles,
      options: permissionOptions.Value,
      hasJournalReadRoleInOrgLevels: hasJournalReadRoleInOrgLevels,
      hasJournalEditRoleInOrgLevels: hasJournalEditRoleInOrgLevels);

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.UserSettingsModel>.FromItemAndFluentValidation(
        new Dtos.UserSettingsModel(
          user.Id,
          viewModel.UserName,
          visibleStatuses.Split(","),
          user.TaxonomySearchByCz,
          user.TaxonomySearchByLat,
          userPermissions
        ),
        new ValidationResult()
      )
    );
  }

  private static string[] DetermineUserPermissions(string userName, string[] roles, PermissionOptions options,
  bool hasJournalReadRoleInOrgLevels, bool hasJournalEditRoleInOrgLevels)
  {
    if (options.GrantAllPermissions)
    {
      return new[]
      {
        UserPermissions.RecordsView,
        UserPermissions.RecordsEdit,
        UserPermissions.ListsView,
        UserPermissions.ListsEdit,
        UserPermissions.DocumentationDepartment,
        UserPermissions.JournalRead,
        UserPermissions.JournalContribute,
        UserPermissions.JournalAccess
      };
    }

    List<string> permissions = new List<string>();

    if (roles.Any(role => options.RecordsRead.Contains(role)))
      permissions.Add(UserPermissions.RecordsView);

    if (roles.Any(role => options.RecordsEdit.Contains(role)))
      permissions.Add(UserPermissions.RecordsEdit);

    if (roles.Any(role => options.ListsView.Contains(role)))
      permissions.Add(UserPermissions.ListsView);

    if (roles.Any(role => options.ListsEdit.Contains(role)))
      permissions.Add(UserPermissions.ListsEdit);

    var hasDocumentationAccess = roles.Any(role => options.DocumentationDepartment.Contains(role));

    if (hasDocumentationAccess)
      permissions.Add(UserPermissions.DocumentationDepartment);

    var hasJournalRead = roles.Any(role => options.JournalRead.Contains(role)) || hasJournalReadRoleInOrgLevels;
    if (hasJournalRead)
    {
      permissions.Add(UserPermissions.JournalRead);
    }

    if (hasJournalEditRoleInOrgLevels || hasDocumentationAccess)
    {
      permissions.Add(UserPermissions.JournalContribute);
    }

    if (hasJournalEditRoleInOrgLevels || hasDocumentationAccess || hasJournalRead)
    {
      permissions.Add(UserPermissions.JournalAccess);
    }

    return permissions.ToArray();
  }
}
