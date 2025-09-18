using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.Extensions.Options;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Journal;
using PziApi.CrossCutting.Settings;
using PziApi.Models.Journal;
using System.Globalization;

namespace PziApi.JournalEntries.Endpoints;

public static class ProcessApproval
{
  public static async Task<Results<Ok<CommonDtos.SuccessResult<Dtos.Item[]>>, BadRequest<CommonDtos.ValidationErrors>, NotFound>> Handle(
      Dtos.ProcessApprovalRequest request,
      PziDbContext dbContext,
      IOptions<PermissionOptions> permissionOptions)
  {
    var validator = new ProcessApprovalRequestValidator();
    var validationResult = await validator.ValidateAsync(request);

    if (!validationResult.IsValid)
    {
      var validationErrors = CommonDtos.ValidationErrors.FromFluentValidation(validationResult);
      return TypedResults.BadRequest(validationErrors);
    }

    var responseItems = new List<Dtos.Item>();

    using (var tx = await dbContext.Database.BeginTransactionAsync())
    {
      var user = await dbContext.Users
         .Include(u => u.UserRoles)
         .FirstOrDefaultAsync(u => u.UserName == request.ModifiedBy);

      if (user == null)
      {
        return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Single("ModifiedBy", ErrorCodes.ERR_NOT_FOUND, "User not found")
        );
      }

      var entryIds = request.Items.Select(e => e.Id).ToArray();

      var entries = await dbContext.JournalEntries
          .Include(x => x.Specimens)
          .Include(x => x.Attributes)
          .Where(x => entryIds.Contains(x.Id))
          .ToArrayAsync();

      if (entryIds.Any(eid => !entries.Any(e => e.Id == eid)))
      {
        return TypedResults.NotFound();
      }

      var (entryActionsResolver, _, _) = await JournalEntryActionResolver.PrepareJournalEntryActionResolver(dbContext, user, permissionOptions);

      var canExecuteEntries = entries
            .Select((entry) =>
            {
              var canExecute = entryActionsResolver.CanExecuteAction(entry, request.Action);

              return (Id: entry.Id, CanExecute: canExecute);
            })
            .ToArray();

      if (!canExecuteEntries.All((ce) => ce.CanExecute))
      {
        var errors = canExecuteEntries
                          .Where((ce) => !ce.CanExecute)
                          .Select((ce) => (key: $"Items[{ce.Id}]", code: ErrorCodes.ERR_NO_PERMISSION, message: "Action not allowed on entry."))
                          .ToArray();

        return TypedResults.BadRequest(
          CommonDtos.ValidationErrors.Multiple(errors)
        );
      }

      var timestamp = DateTimeHelpers.GetLastModifiedAt();

      foreach (var entry in entries)
      {
        var requestEntry = request.Items.First(e => e.Id == entry.Id);

        if (requestEntry.IsUpdated)
        {
          entry.EntryDate = DateTime.ParseExact(requestEntry.EntryDate, "yyyy/MM/dd", CultureInfo.InvariantCulture);
          entry.EntryType = requestEntry.EntryType;
          entry.ActionTypeCode = requestEntry.ActionTypeCode;
          entry.OrganizationLevelId = requestEntry.OrganizationLevelId;
          entry.SpeciesId = requestEntry.SpeciesId;
          entry.Note = requestEntry.Note;
          entry.ModifiedBy = request.ModifiedBy;
          entry.ModifiedAt = timestamp;

          dbContext.JournalEntrySpecimens.RemoveRange(entry.Specimens ?? Enumerable.Empty<JournalEntrySpecimen>());
          await dbContext.SaveChangesAsync();

          if (requestEntry.Specimens != null && requestEntry.Specimens.Any())
          {
            foreach (var specimenItem in requestEntry.Specimens)
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

          if (requestEntry.Attributes != null && requestEntry.Attributes.Any())
          {
            foreach (var entryAttribute in requestEntry.Attributes)
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
        }

        switch (request.Action)
        {
          case JournalActionCodes.CLOSE:
            {
              switch (entry.Status)
              {
                case JournalRecordStatuses.REVIEW:
                  entry.ReviewedBy = request.ModifiedBy;
                  entry.ReviewedAt = timestamp;
                  entry.Status = JournalRecordStatuses.CLOSED_IN_REVIEW;
                  break;
                case JournalRecordStatuses.REVIEW_DOCUMENTATION_DEP:
                  entry.ArchiveReviewedBy = request.ModifiedBy;
                  entry.ArchiveReviewedAt = timestamp;
                  entry.Status = JournalRecordStatuses.CLOSED_IN_DOCUMENTATION_DEP;
                  break;
                default:
                  break;
              }

              entry.ModifiedBy = request.ModifiedBy;
              entry.ModifiedAt = timestamp;

              break;
            }

          case JournalActionCodes.SENT_TO_REVIEW:
            {
              entry.Status = JournalRecordStatuses.REVIEW_DOCUMENTATION_DEP;
              entry.ReviewedBy = request.ModifiedBy;
              entry.ReviewedAt = timestamp;
              entry.ModifiedBy = request.ModifiedBy;
              entry.ModifiedAt = timestamp;

              break;
            }

          case JournalActionCodes.SOLVE:
            {
              entry.Status = JournalRecordStatuses.SOLVED_IN_DOCUMENTATION_DEP;
              entry.ArchiveReviewedBy = request.ModifiedBy;
              entry.ArchiveReviewedAt = timestamp;
              entry.ModifiedBy = request.ModifiedBy;
              entry.ModifiedAt = timestamp;

              break;
            }

          default:
            break;
        }

        responseItems.Add(new Dtos.Item(entry.Id));
      }

      await dbContext.SaveChangesAsync();

      await tx.CommitAsync();
    }

    return TypedResults.Ok(
      CommonDtos.SuccessResult<Dtos.Item[]>.FromItemAndFluentValidation(
        responseItems.ToArray(),
        new FluentValidation.Results.ValidationResult()
      )
    );
  }
}
