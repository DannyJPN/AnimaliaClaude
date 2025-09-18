using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using PziApi.CrossCutting;
using PziApi.CrossCutting.Database;
using PziApi.CrossCutting.Journal;

namespace PziApi.JournalCommon.Endpoints;

public class ActionTypesList
{
  public record JournalActionTypeItem(
    string Code,
    string JournalEntryType,
    int Sort,
    string DisplayName,
    string? Note
  );

  public static async Task<Results<Ok<CommonDtos.SuccessResult<IEnumerable<JournalActionTypeItem>>>, BadRequest<CommonDtos.ValidationErrors>>> Handle(
    string entryType,
    PziDbContext dbContext)
  {
    if (string.IsNullOrEmpty(entryType))
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("entryType", ErrorCodes.ERR_EMPTY, "Entry type is required.")
      );
    }

    if (entryType != JournalEntryType.BIO && entryType != JournalEntryType.MOVEMENT)
    {
      return TypedResults.BadRequest(
        CommonDtos.ValidationErrors.Single("entryType", ErrorCodes.ERR_INVALID_VALUE, $"Provided entry type {entryType} is not valid (Bio, Movement).")
      );
    }

    var actionTypes = await dbContext.JournalActionTypes
      .Where(a => a.JournalEntryType == entryType)
      .Select(s => new JournalActionTypeItem(s.Code, s.JournalEntryType, s.Sort, s.DisplayName, s.Note))
      .ToArrayAsync();

    return TypedResults.Ok(
      CommonDtos.SuccessResult<IEnumerable<JournalActionTypeItem>>.FromItem(actionTypes)
    );
  }
}