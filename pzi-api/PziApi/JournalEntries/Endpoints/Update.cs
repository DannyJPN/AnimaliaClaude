using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Journal;
using PziApi.CrossCutting.Settings;
using PziApi.Models.Journal;
using System.Globalization;

namespace PziApi.JournalEntries.Endpoints;

public static class Update
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, BadRequest<CommonDtos.ValidationErrors>, NotFound>> Handle(
      int id,
      Dtos.UpdateRequest request,
      PziDbContext dbContext,
      IOptions<PermissionOptions> permissionOptions)
  {
    var validator = new UpdateValidator();
    var validationResult = await validator.ValidateAsync(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
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

    var entry = await dbContext.JournalEntries
        .Include(x => x.Specimens)
        .Include(x => x.Attributes)
        .FirstOrDefaultAsync(x => x.Id == id);

    if (entry == null)
    {
      return TypedResults.NotFound();
    }

    var (entryActionsResolver, _, _) = await JournalEntryActionResolver.PrepareJournalEntryActionResolver(dbContext, user, permissionOptions);

    var canExecute = entryActionsResolver.CanExecuteAction(entry, JournalActionCodes.EDIT);

    if (!canExecute)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("", ErrorCodes.ERR_NO_PERMISSION, "Action not allowed on entry.")
      );
    }

    var timestamp = DateTimeHelpers.GetLastModifiedAt();
    Dtos.Item resultItem;

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      entry.EntryDate = DateTime.ParseExact(request.EntryDate, "yyyy/MM/dd", CultureInfo.InvariantCulture);
      entry.EntryType = request.EntryType;
      entry.ActionTypeCode = request.ActionTypeCode;
      entry.OrganizationLevelId = request.OrganizationLevelId;
      entry.SpeciesId = request.SpeciesId;
      entry.Note = request.Note;
      entry.ModifiedBy = request.ModifiedBy;
      entry.ModifiedAt = timestamp;

      dbContext.JournalEntrySpecimens.RemoveRange(entry.Specimens ?? Enumerable.Empty<JournalEntrySpecimen>());
      await dbContext.SaveChangesAsync();

      if (request.Specimens != null && request.Specimens.Any())
      {
        foreach (var specimenItem in request.Specimens)
        {
          var specimen = new JournalEntrySpecimen
          {
            JournalEntryId = entry.Id,
            SpecimenId = specimenItem.SpecimenId,
            Note = specimenItem.Note,
            ModifiedBy = request.ModifiedBy,
            ModifiedAt = timestamp
          };
          dbContext.JournalEntrySpecimens.Add(specimen);
          await dbContext.SaveChangesAsync();

          if (specimenItem.Attributes != null && specimenItem.Attributes.Any())
          {
            foreach (var specAttribute in specimenItem.Attributes)
            {
              var attribute = new JournalEntrySpecimenAttribute
              {
                JournalEntrySpecimenId = specimen.Id,
                AttributeTypeCode = specAttribute.AttributeTypeCode,
                AttributeValue = specAttribute.AttributeValue
              };
              dbContext.JournalEntrySpecimenAttributes.Add(attribute);
            }
            await dbContext.SaveChangesAsync();
          }
        }
      }

      dbContext.JournalEntryAttributes.RemoveRange(entry.Attributes ?? Enumerable.Empty<JournalEntryAttribute>());
      await dbContext.SaveChangesAsync();

      if (request.Attributes != null && request.Attributes.Any())
      {
        foreach (var entryAttribute in request.Attributes)
        {
          var attribute = new JournalEntryAttribute
          {
            JournalEntryId = entry.Id,
            AttributeTypeCode = entryAttribute.AttributeTypeCode,
            AttributeValue = entryAttribute.AttributeValue
          };
          dbContext.JournalEntryAttributes.Add(attribute);
        }
        await dbContext.SaveChangesAsync();
      }

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

      await tx.CommitAsync();
      resultItem = new Dtos.Item(entry.Id);
    }

    return TypedResults.Ok(
        CommonDtos.SuccessResult<Dtos.Item>.FromItemAndFluentValidation(
            resultItem,
            new FluentValidation.Results.ValidationResult()
        )
    );
  }
}
