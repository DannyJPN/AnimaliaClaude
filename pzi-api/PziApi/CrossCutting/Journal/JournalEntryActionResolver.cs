using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Settings;
using PziApi.Models;
using PziApi.Models.Journal;
using YamlDotNet.Serialization.NodeTypeResolvers;

namespace PziApi.CrossCutting.Journal;

public class JournalEntryActionResolver
{
  public static async Task<(
    JournalEntryActionResolver entryActionsResolver,
    int[] accessibleOrgLevelIds,
    bool hasGlobalAccess
    )> PrepareJournalEntryActionResolver(PziDbContext dbContext, User user, IOptions<PermissionOptions> permissionOptions)
  {
    var userRoleNames = user.UserRoles?.Select(r => r.RoleName).ToList() ?? [];

    bool hasGlobalAccess = permissionOptions.Value.GrantAllPermissions ||
    userRoleNames.Any(role =>
        permissionOptions.Value.DocumentationDepartment.Contains(role) ||
        permissionOptions.Value.JournalRead.Contains(role));

    var accessibleOrgLevels = await dbContext.OrganizationLevels
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

    var accessibleOrgLevelIds = accessibleOrgLevels.Select(ol => ol.Id).ToArray();

    var entryActionsResolver = new JournalEntryActionResolver(
      accessibleOrgLevels,
      user.UserRoles ?? [],
      user.UserName,
      permissionOptions.Value.DocumentationDepartment,
      permissionOptions.Value.GrantAllPermissions);

    return (entryActionsResolver, accessibleOrgLevelIds, hasGlobalAccess);
  }

  private readonly HashSet<int> readAccess = new HashSet<int>();
  private readonly HashSet<int> approveAccess = new HashSet<int>();
  private readonly HashSet<int> contributeAccess = new HashSet<int>();
  private readonly bool hasDocumentationAccess = false;
  private readonly string userName;

  public JournalEntryActionResolver(
    IEnumerable<OrganizationLevel> organizationLevels,
    IEnumerable<UserRole> userRoles,
    string userName,
    IEnumerable<string> documentationRoles,
    bool grantAllPermissions)
  {
    this.userName = userName;
    var roles = userRoles.Select(r => r.RoleName).ToHashSet();

    hasDocumentationAccess = grantAllPermissions
    || (documentationRoles != null
      && documentationRoles.Any(role => !string.IsNullOrEmpty(role) && roles.Contains(role)));

    foreach (var orgLevel in organizationLevels)
    {
      if ((!string.IsNullOrEmpty(orgLevel.JournalApproversGroup) && roles.Contains(orgLevel.JournalApproversGroup))
      || (!string.IsNullOrEmpty(orgLevel.Parent?.JournalApproversGroup) && roles.Contains(orgLevel.Parent.JournalApproversGroup))
      || (!string.IsNullOrEmpty(orgLevel.Parent?.Parent?.JournalApproversGroup) && roles.Contains(orgLevel.Parent.Parent.JournalApproversGroup)))
      {
        readAccess.Add(orgLevel.Id);
        approveAccess.Add(orgLevel.Id);
        contributeAccess.Add(orgLevel.Id);
      }

      if ((!string.IsNullOrEmpty(orgLevel.JournalContributorGroup) && roles.Contains(orgLevel.JournalContributorGroup))
        || (!string.IsNullOrEmpty(orgLevel.Parent?.JournalContributorGroup) && roles.Contains(orgLevel.Parent.JournalContributorGroup))
        || (!string.IsNullOrEmpty(orgLevel.Parent?.Parent?.JournalContributorGroup) && roles.Contains(orgLevel.Parent.Parent.JournalContributorGroup)))
      {
        readAccess.Add(orgLevel.Id);
        contributeAccess.Add(orgLevel.Id);
      }

      if ((!string.IsNullOrEmpty(orgLevel.JournalReadGroup) && roles.Contains(orgLevel.JournalReadGroup))
        || (!string.IsNullOrEmpty(orgLevel.Parent?.JournalReadGroup) && roles.Contains(orgLevel.Parent.JournalReadGroup))
        || (!string.IsNullOrEmpty(orgLevel.Parent?.Parent?.JournalReadGroup) && roles.Contains(orgLevel.Parent.Parent.JournalReadGroup)))
      {
        readAccess.Add(orgLevel.Id);
      }
    }
  }

  public string[] GetActions(JournalEntry entry)
  {
    if (entry.Status == JournalRecordStatuses.CLOSED_IN_DOCUMENTATION_DEP
    || entry.Status == JournalRecordStatuses.CLOSED_IN_REVIEW
    || entry.Status == JournalRecordStatuses.SOLVED_IN_DOCUMENTATION_DEP
    || entry.IsDeleted)
    {
      return [];
    }

    if (entry.Status == JournalRecordStatuses.REVIEW && (approveAccess.Contains(entry.OrganizationLevelId) || hasDocumentationAccess))
    {
      return [JournalActionCodes.EDIT, JournalActionCodes.DELETE, JournalActionCodes.SENT_TO_REVIEW, JournalActionCodes.CLOSE];
    }

    if (entry.Status == JournalRecordStatuses.REVIEW
      && entry.AuthorName == userName)
    {
      return [JournalActionCodes.EDIT, JournalActionCodes.DELETE];
    }

    if (entry.Status == JournalRecordStatuses.REVIEW_DOCUMENTATION_DEP && hasDocumentationAccess)
    {
      return [JournalActionCodes.EDIT, JournalActionCodes.CLOSE, JournalActionCodes.SOLVE, JournalActionCodes.DELETE];
    }

    return [];
  }

  public bool CanInsertEntry(int organizationlevelid)
  {
    return contributeAccess.Contains(organizationlevelid) || hasDocumentationAccess;
  }

  public bool CanExecuteAction(JournalEntry entry, string action)
  {
    if (entry.IsDeleted)
    {
      return false;
    }

    var allowedActions = GetActions(entry);

    return allowedActions.Contains(action);
  }
}
