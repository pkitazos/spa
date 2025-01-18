import { toZonedTime } from "date-fns-tz";

/* Return a Date for the last Sunday in a month
 ** @param {number} year - full year number (e.g. 2015)
 ** @param {number} month - calendar month number (jan=1)
 ** @returns {Date} date for last Sunday in given month
 */
function getLastSunday(year: number, month: number) {
  // Create date for last day in month
  const d = new Date(year, month, 0);
  // Adjust to previous Sunday
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/* Format a date string as ISO 8601 with supplied offset
 ** @param {Date} date - date to format
 ** @param {number} offset - offset in minutes (+east, -west), will be
 **                          converted to +/-00:00
 ** @returns {string} formatted date and time
 **
 ** Note that javascript Date offsets are opposite: -east, +west but
 ** this function doesn't use the Date's offset.
 */
function formatDate(d: Date, offset: number) {
  function z(n: number) {
    return ("0" + n).slice(-2);
  }
  // Default offset to 0
  offset = offset || 0;
  // Generate offset string
  const offSign = offset < 0 ? "-" : "+";
  offset = Math.abs(offset);
  const offString =
    offSign +
    ("0" + ((offset / 60) | 0)).slice(-2) +
    ":" +
    ("0" + (offset % 60)).slice(-2);
  // Generate date string
  return (
    d.getUTCFullYear() +
    "-" +
    z(d.getUTCMonth() + 1) +
    "-" +
    z(d.getUTCDate()) +
    "T" +
    z(d.getUTCHours()) +
    ":" +
    z(d.getUTCMinutes()) +
    ":" +
    z(d.getUTCSeconds()) +
    offString
  );
}

/* Return Date object for current time in London. Assumes
 ** daylight saving starts at 01:00 UTC on last Sunday in March
 ** and ends at 01:00 UTC on the last Sunday in October.
 ** @param {Date} d - date to test. Default to current
 **                   system date and time
 ** @param {boolean, optional} obj - if true, return a Date object. Otherwise, return
 **                        an ISO 8601 formatted string
 */
function getLondonTime(d: Date) {
  // Get start and end dates for daylight saving for supplied date's year
  // Set UTC date values and time to 01:00
  let dstS = getLastSunday(d.getFullYear(), 3);
  let dstE = getLastSunday(d.getFullYear(), 10);
  dstS = new Date(
    Date.UTC(dstS.getFullYear(), dstS.getMonth(), dstS.getDate(), 1),
  );
  dstE = new Date(
    Date.UTC(dstE.getFullYear(), dstE.getMonth(), dstE.getDate(), 1),
  );
  // If date is between dstStart and dstEnd, add 1 hour to UTC time
  // and format using +60 offset
  if (d > dstS && d < dstE) {
    d.setUTCHours(d.getUTCHours() + 1);
    return formatDate(d, 60);
  }

  return formatDate(d, 0);
}

/**
 * Returns a string representation of the timezone offset of the date in the format "GMT+HH:MM"
 * @param date a date object
 * @returns a string representation of the timezone offset of the date in the format "GMT+HH:MM"
 * @example getGMTOffset(new Date("2021-10-10T12:00:00Z")) // "GMT+01:00" if the date falls in daylight saving time
 */
export function getGMTOffset(date: Date) {
  const dateStr = getLondonTime(date);
  const timeZoneOffset = dateStr.split("+")[1];
  return `GMT+${timeZoneOffset}`;
}

export function getGMTZoned(date: Date) {
  return toZonedTime(date, "Europe/London");
}
