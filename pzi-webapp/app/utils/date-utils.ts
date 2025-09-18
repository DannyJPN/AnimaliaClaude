import { date } from "zod";

/**
 * Formats a date string from YYYY/MM/DD to DD.MM.YYYY (Czech format).
 * If the input is not a valid YYYY/MM/DD string, it returns the original string.
 * @param dateStr The date string to format (expected as YYYY/MM/DD).
 * @returns The formatted date string (DD.MM.YYYY) or the original string if formatting fails.
 */
export function formatToCzechDate(dateStr: string | null | undefined): string {
  if (!dateStr) {
    return '';
  }

  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    // Basic validation for numeric parts and sensible lengths
    if (
      year.length === 4 &&
      month.length >= 1 && month.length <= 2 &&
      day.length >= 1 && day.length <= 2 &&
      !isNaN(parseInt(year)) &&
      !isNaN(parseInt(month)) &&
      !isNaN(parseInt(day))
    ) {
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
    }
  }
  return dateStr;
}

export function getXlsFileTimestamp() {
  // NOTE: Return first 12 numbers of timestamp
  return new Date().toISOString().replaceAll('-', '').replaceAll('T', '').replaceAll(':', '').substring(0, 12);
}
