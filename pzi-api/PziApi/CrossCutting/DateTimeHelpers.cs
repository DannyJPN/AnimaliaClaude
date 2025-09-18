using System.Globalization;

namespace PziApi.CrossCutting;

public static class DateTimeHelpers
{
  private const string defaultFormat = "yyyy/MM/dd";

  public static DateTime GetLastModifiedAt()
  {
    return DateTime.Now;
  }

  /// <summary>
  /// Tries to extract date from the given string. It supports string formats like: yyyy/MM/dd, yyyy/MM and yyyy.
  /// </summary>
  /// <param name="date">The date.</param>
  /// <param name="result">The result.</param>
  public static bool TryToExtractDate(string? date, out DateTime result)
  {
    result = default;
    
    var createdDate = ExtractDate(date);
    if(createdDate.HasValue)
    {
      result = createdDate.Value;
      return true;
    }

    return false;
  }

  // Standardize date format to ensure proper comparison
  public static string StandardizeDate(string date)
  {
    if (string.IsNullOrEmpty(date))
      return string.Empty;

    var parts = date.Split('/');
    if (parts.Length == 1 && parts[0].Length <= 4) // Just year
      return parts[0].PadLeft(4, '0');
    if (parts.Length == 2) // Year and month
      return $"{parts[0].PadLeft(4, '0')}/{parts[1].PadLeft(2, '0')}";
    if (parts.Length == 3) // Full date
      return $"{parts[0].PadLeft(4, '0')}/{parts[1].PadLeft(2, '0')}/{parts[2].PadLeft(2, '0')}";

    return date;
  }

  // Compare two dates, handling partial dates correctly
  public static int CompareDates(string date1, string date2)
  {
    // Standardize dates
    string standardizedDate1 = StandardizeDate(date1);
    string standardizedDate2 = StandardizeDate(date2);

    // Compare using the shorter length
    int compareLength = Math.Min(standardizedDate1.Length, standardizedDate2.Length);

    // Check initial comparison at the common length
    int result = string.Compare(
        standardizedDate1.Substring(0, compareLength),
        standardizedDate2.Substring(0, compareLength),
        StringComparison.Ordinal
    );

    // If initial segments are equal but lengths differ
    if (result == 0 && standardizedDate1.Length != standardizedDate2.Length)
    {
      // The shorter date is considered "larger" (comes later)
      return standardizedDate1.Length < standardizedDate2.Length ? 1 : -1;
    }

    return result;
  }

  /// <summary>
  /// Creates valid date string from the given string. It supports string formats like: yyyy/MM/dd, yyyy/MM and yyyy.
  /// In case of yyyy/MM/dd = yyyy/MM/dd.
  /// In case of yyyy/MM = yyyy/MM/{daysInMonth}. (DateTime.DaysInMonth(year, month))
  /// In case of yyyy = yyyy/12/31
  /// </summary>
  /// <param name="date">The date.</param>
  /// <returns>The valid date string in format yyyy/MM/dd.</returns>
  public static string ExtractDateString(string? date)
  {
    if (string.IsNullOrWhiteSpace(date) || date.Length < 4 || date.Length > 10)
    {
      return string.Empty;
    }

    if (DateTime.TryParseExact(date, "yyyy/MM/dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var fullDate))
    {
      return fullDate.ToString("yyyy/MM/dd");
    }

    if (DateTime.TryParseExact(date, "yyyy/MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var yearMonthDate))
    {
      int daysInMonth = DateTime.DaysInMonth(yearMonthDate.Year, yearMonthDate.Month);
      var lastDayOfMonth = new DateTime(yearMonthDate.Year, yearMonthDate.Month, daysInMonth);
      return lastDayOfMonth.ToString("yyyy/MM/dd");
    }

    if (DateTime.TryParseExact(date, "yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var yearDate))
    {
      var lastDayOfYear = new DateTime(yearDate.Year, 12, 31);
      return lastDayOfYear.ToString("yyyy/MM/dd");
    }

    return string.Empty;
  }

  /// <summary>
  /// Creates valid date from the given string. It supports string formats like: yyyy/MM/dd, yyyy/MM and yyyy.
  /// In case of yyyy/MM/dd = yyyy/MM/dd.
  /// In case of yyyy/MM = yyyy/MM/{daysInMonth}. (DateTime.DaysInMonth(year, month))
  /// In case of yyyy = yyyy/12/31
  /// </summary>
  /// <param name="date">The date.</param>
  public static DateTime? ExtractDate(string? date)
  {
    if (string.IsNullOrWhiteSpace(date) || date.Length < 4 || date.Length > 10)
    {
      return null;
    }

    if (DateTime.TryParseExact(date, "yyyy/MM/dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var exactDate))
    {
      return exactDate;
    }

    if (DateTime.TryParseExact(date, "yyyy/MM", CultureInfo.InvariantCulture, DateTimeStyles.None, out var yearMonthDate))
    {
      int daysInMonth = DateTime.DaysInMonth(yearMonthDate.Year, yearMonthDate.Month);
      return new DateTime(yearMonthDate.Year, yearMonthDate.Month, daysInMonth);
    }

    if (DateTime.TryParseExact(date, "yyyy", CultureInfo.InvariantCulture, DateTimeStyles.None, out var yearDate))
    {
      return new DateTime(yearDate.Year, 12, 31);
    }

    return null;
  }

  /// <summary>
  /// Calculates the days difference. (Date format yyyy/mm/dd or yyyy/mm or yyyy)
  /// </summary>
  /// <param name="startDate">The start date.</param>
  /// <param name="endDate">The end date.</param>
  public static int CalculateDaysDifference(string startDate, string endDate)
  {
    if (string.IsNullOrWhiteSpace(startDate) || string.IsNullOrWhiteSpace(endDate) || startDate == endDate)
    {
      return 0;
    }

    var formattedStartDate = ExtractDate(startDate);
    var formattedEndDate = ExtractDate(endDate);

    if (formattedEndDate.HasValue && formattedStartDate.HasValue)
    {
      return (int)(formattedEndDate.Value - formattedStartDate.Value).TotalDays;
    }

    return 0;
  }

  /// <summary>
  /// Determines whether [is valid date string input] [the specified date string]. Valid formats are: yyyy/MM/dd.
  /// </summary>
  /// <param name="dateString">The date string.</param>
  /// <returns>
  ///   <c>true</c> if [is valid date string input] [the specified date string]; otherwise, <c>false</c>.
  /// </returns>
  public static bool IsValidFullDateString(string dateString)
  {
    if (string.IsNullOrWhiteSpace(dateString))
    {
      return false;
    }

    if (DateTime.TryParseExact(dateString, defaultFormat, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime date))
    {
      return true;
    }

    return false;
  }

  /// <summary>
  /// Determines whether [is valid date string input] [the specified date string].
  /// NOTE: From our inputs we will not support any invalid date inputs. (yyyy, yyyy/MM, yyyy/MM/dd)
  /// </summary>
  /// <param name="dateString">The date string.</param>
  /// <returns>
  ///   <c>true</c> if [is valid date string input] [the specified date string]; otherwise, <c>false</c>.
  /// </returns>
  public static bool IsValidDateStringInput(string dateString)
  {
    var date = ExtractDate(dateString);

    return date.HasValue;
  }

  public static string ToApiDate(this DateTime date, string format = "yyyy/MM/dd")
  {
    return date.ToString(format);
  }

  public static string ToCzDateFormat(this DateTime date)
  {
    return date.ToString("dd.MM.yyyy");
  }
}
