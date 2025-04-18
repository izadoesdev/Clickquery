/**
 * Returns the current date and time
 * @returns A new Date object set to the current date and time
 */
export function now(): Date {
  return new Date();
}

/**
 * Returns a Date object for the beginning of the day (00:00:00)
 * @param date Date to get the start of day for (default: now)
 * @returns A Date object set to the start of the specified day
 */
export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Returns a Date object for the end of the day (23:59:59.999)
 * @param date Date to get the end of day for (default: now)
 * @returns A Date object set to the end of the specified day
 */
export function endOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Formats a date as ISO string without milliseconds and timezone
 * Useful for ClickHouse DateTime columns
 * @param date Date to format
 * @returns A string in format YYYY-MM-DD HH:MM:SS
 */
export function formatDateTime(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Formats a date as YYYY-MM-DD
 * Useful for ClickHouse Date columns
 * @param date Date to format
 * @returns A string in format YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().substring(0, 10);
} 