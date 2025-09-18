using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Journal;
using PziApi.CrossCutting.Settings;

namespace PziApi.JournalEntries.Endpoints;

public static class ToDocumentation
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, BadRequest<CommonDtos.ValidationErrors>, NotFound>> Handle(
      int id,
      Dtos.ChangeStatusRequest request,
      PziDbContext dbContext,
      IOptions<PermissionOptions> permissionOptions)
  {
    var validator = new ChangeStatusValidator();
    var validationResult = validator.Validate(request);

    if (!validationResult.IsValid)
    {
      return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.FromFluentValidation(validationResult)
      );
    }

    var entry = await dbContext.JournalEntries.FindAsync(id);
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

    var canExecute = entryActionsResolver.CanExecuteAction(entry, JournalActionCodes.SENT_TO_REVIEW);

    if (!canExecute)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("", ErrorCodes.ERR_NO_PERMISSION, "Action not allowed on entry.")
      );
    }

    var timestamp = DateTimeHelpers.GetLastModifiedAt();

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      // Create audit entry
      //var auditEntry = new JournalEntryAudit
      //{
      //  JournalEntryId = entry.Id,
      //  SerializedData = System.Text.Json.JsonSerializer.Serialize(entry),
      //  ModifiedBy = request.ModifiedBy,
      //  ModifiedAt = timestamp
      //};
      //dbContext.JournalEntryAudits.Add(auditEntry);
      //await dbContext.SaveChangesAsync();

      entry.Status = JournalRecordStatuses.REVIEW_DOCUMENTATION_DEP;
      entry.ReviewedBy = request.ModifiedBy;
      entry.ReviewedAt = timestamp;
      entry.CuratorReviewNote = request.ReviewNote;
      entry.ModifiedBy = request.ModifiedBy;
      entry.ModifiedAt = timestamp;

      await dbContext.SaveChangesAsync();
      await tx.CommitAsync();
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
            new Dtos.Item(entry.Id),
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
