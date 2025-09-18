using Microsoft.AspNetCore.Http.HttpResults;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting.Journal;
using PziApi.CrossCutting.Settings;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc;

namespace PziApi.JournalEntries.Endpoints;

public static class Delete
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult>, BadRequest<CommonDtos.ValidationErrors>, NotFound>> Handle(
    int id,
    [FromBody] Dtos.DeleteRequest request,
    PziDbContext dbContext,
    IOptions<PermissionOptions> permissionOptions)
  {
    var entry = await dbContext.JournalEntries.FirstOrDefaultAsync(m => m.Id == id);
    if (entry == null)
    {
      return TypedResults.NotFound();
    }

    var user = await dbContext.Users
        .Include(u => u.UserRoles)
        .FirstOrDefaultAsync(u => u.UserName == request.ModifiedBy);

    if (user == null)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("ModifiedBy", ErrorCodes.ERR_NOT_FOUND, "User not found")
      );
    }

    var (entryActionsResolver, _, _) = await JournalEntryActionResolver.PrepareJournalEntryActionResolver(dbContext, user, permissionOptions);

    var canExecute = entryActionsResolver.CanExecuteAction(entry, JournalActionCodes.DELETE);

    if (!canExecute)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("", ErrorCodes.ERR_NO_PERMISSION, "Action not allowed on entry.")
      );
    }

    entry.IsDeleted = true;
    entry.ModifiedAt = DateTimeHelpers.GetLastModifiedAt();
    entry.ModifiedBy = request.ModifiedBy;

    await dbContext.SaveChangesAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult.FromFluentValidation(
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}

