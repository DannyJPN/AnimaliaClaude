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

public static class Insert
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
      Dtos.InsertRequest request,
      PziDbContext dbContext,
      IOptions<PermissionOptions> permissionOptions)
  {
    var validator = new InsertValidator();
    var validationResult = await validator.ValidateAsync(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var author = await dbContext.Users
      .Include(u => u.UserRoles)
      .FirstOrDefaultAsync(u => u.UserName == request.AuthorName);

    if (author == null)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("AuthorName", ErrorCodes.ERR_NOT_FOUND, "Author not found")
      );
    }

    var (entryActionsResolver, _, _) = await JournalEntryActionResolver.PrepareJournalEntryActionResolver(dbContext, author!, permissionOptions);

    var canInsertEntry = entryActionsResolver.CanInsertEntry(request.OrganizationLevelId);

    if (!canInsertEntry)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("OrganizationLevelId", ErrorCodes.ERR_NO_PERMISSION, "No journal insert permisison for given organization level")
      );
    }

    var timestamp = DateTimeHelpers.GetLastModifiedAt();
    Dtos.Item resultItem;

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var entry = new JournalEntry
      {
        AuthorName = request.AuthorName,
        EntryDate = DateTime.ParseExact(request.EntryDate, "yyyy/MM/dd", CultureInfo.InvariantCulture),
        EntryType = request.EntryType,
        ActionTypeCode = request.ActionTypeCode,
        OrganizationLevelId = request.OrganizationLevelId,
        SpeciesId = request.SpeciesId,
        Status = JournalRecordStatuses.REVIEW,
        Note = request.Note,
        IsDeleted = false,
        CreatedBy = request.ModifiedBy,
        CreatedAt = timestamp,
        ModifiedBy = request.ModifiedBy,
        ModifiedAt = timestamp
      };

      dbContext.JournalEntries.Add(entry);
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
                AttributeValue = specAttribute?.AttributeValue
              };
              dbContext.JournalEntrySpecimenAttributes.Add(attribute);
            }
            await dbContext.SaveChangesAsync();
          }
        }
      }

      if (request.Attributes != null && request.Attributes.Any())
      {
        foreach (var entryAttribute in request.Attributes)
        {
          var attribute = new JournalEntryAttribute
          {
            JournalEntryId = entry.Id,
            AttributeTypeCode = entryAttribute.AttributeTypeCode,
            AttributeValue = entryAttribute?.AttributeValue
          };
          dbContext.JournalEntryAttributes.Add(attribute);
        }
        await dbContext.SaveChangesAsync();
      }

      // Create audit entry
      //var jsonEntry = System.Text.Json.JsonSerializer.Serialize(entry);
      //var auditEntry = new JournalEntryAudit
      //{
      //  JournalEntryId = entry.Id,
      //  SerializedData = jsonEntry,
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
