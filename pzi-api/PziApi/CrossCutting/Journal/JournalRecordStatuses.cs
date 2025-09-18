namespace PziApi.CrossCutting.Journal;

public static class JournalRecordStatuses
{
  public const string REVIEW = "1-review";
  public const string CLOSED_IN_REVIEW = "2-closed_in_review";
  public const string REVIEW_DOCUMENTATION_DEP = "3-review_in_doc";
  public const string CLOSED_IN_DOCUMENTATION_DEP = "4-closed_in_doc";
  public const string SOLVED_IN_DOCUMENTATION_DEP = "5-solved_in_doc";
}
