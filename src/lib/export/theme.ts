// The export palette, shared by the Excel workbook and the printable report.
// Same zinc band and amber stripe as the GWA Calculator's reports. Plain sRGB
// hex, not the app's oklch tokens: spreadsheet apps and print engines handle
// it most predictably.
export const EXPORT_COLORS = {
  ink: "18181B", // zinc-900: body text, header band
  inkSoft: "3F3F46", // zinc-700
  muted: "71717A", // zinc-500: labels, captions
  bandText: "D4D4D8", // zinc-300: subtitle on the band
  hairline: "E4E4E7", // zinc-200: rules, borders
  panel: "FAFAFA", // zinc-50: tiles, table headers
  zebra: "F6F6F7",
  stripe: "EAB308",
  amber: "FBB217", // the app's --primary
  amberInk: "B45309", // amber dark enough for text and thin lines on white
  income: "15803D", // green-700
  expense: "B91C1C", // red-700
  white: "FFFFFF",
} as const;

/** Same colors with a leading # for CSS. */
export const PRINT = Object.fromEntries(
  Object.entries(EXPORT_COLORS).map(([key, hex]) => [key, `#${hex}`]),
) as { [K in keyof typeof EXPORT_COLORS]: string };

export const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export const FONT_MONO =
  'ui-monospace, "Cascadia Mono", "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

/** Peso amounts in Excel: "₱1,234.50" and "-₱80.00", still numbers you can sum. */
export const MONEY_FORMAT = '"₱"#,##0.00;-"₱"#,##0.00';
export const DATE_FORMAT = "mmm d, yyyy";
export const PERCENT_FORMAT = "0.0%";
