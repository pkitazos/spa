// MOVE to 'lib/format'
/**
 *
 * @param n the number to convert to positional notation
 * @returns the number in positional notation
 * @example toPositional(1) => 1st
 */
export function toPositional(n: number): string {
  if (n < 1) throw new Error("Input number must be positive");

  const lastTwoDigits = n % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return `${n}th`;
  }

  const lastDigit = n % 10;
  const suffix =
    lastDigit === 1
      ? "st"
      : lastDigit === 2
        ? "nd"
        : lastDigit === 3
          ? "rd"
          : "th";

  return `${n}${suffix}`;
}
