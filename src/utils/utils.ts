import { I18N } from "~/utils/config";

const formatter: Intl.DateTimeFormat =
  I18N?.dateFormatter ||
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * Format a date using the configured I18N formatter.
 * @param date - The Date object to format.
 * @returns Formatted date string.
 */
export const getFormattedDate = (date: Date): string =>
  date ? formatter.format(date) : "";

/**
 * Trim a specific character from the start and end of a string.
 * @param str - Input string.
 * @param ch - Character to trim.
 * @returns The trimmed string.
 */
export const trim = (str = "", ch?: string): string => {
  let start = 0;
  let end = str.length || 0;
  while (start < end && str[start] === ch) ++start;
  while (end > start && str[end - 1] === ch) --end;
  return start > 0 || end < str.length ? str.substring(start, end) : str;
};

/**
 * Convert a number into UI-friendly format such as 1.2K, 3M, or 7B.
 * @param amount - The numeric value to format.
 * @returns A formatted string representing K / M / B magnitudes.
 */
export const toUiAmount = (amount: number): string => {
  if (!amount) return "0";

  let value: string;

  if (amount >= 1_000_000_000) {
    const formattedNumber = (amount / 1_000_000_000).toFixed(1);
    value =
      Number(formattedNumber) === parseInt(formattedNumber)
        ? parseInt(formattedNumber) + "B"
        : formattedNumber + "B";
  } else if (amount >= 1_000_000) {
    const formattedNumber = (amount / 1_000_000).toFixed(1);
    value =
      Number(formattedNumber) === parseInt(formattedNumber)
        ? parseInt(formattedNumber) + "M"
        : formattedNumber + "M";
  } else if (amount >= 1_000) {
    const formattedNumber = (amount / 1_000).toFixed(1);
    value =
      Number(formattedNumber) === parseInt(formattedNumber)
        ? parseInt(formattedNumber) + "K"
        : formattedNumber + "K";
  } else {
    value = Number(amount).toFixed(0);
  }

  return value;
};
