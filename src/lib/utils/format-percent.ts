const fmt = new Intl.NumberFormat("en-gb", {
  style: "percent",
  maximumFractionDigits: 1,
});

export function FormatPercent(n: number) {
  return fmt.format(n);
}
