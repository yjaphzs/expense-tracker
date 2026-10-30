import { formatCurrency } from "@/lib/utils";

// Everything user-entered must pass through escapeHtml: the report is a raw HTML string.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escaped peso amount, e.g. "₱1,234.50". */
export const money = (value: number) => escapeHtml(formatCurrency(value));

/** "38.5%" */
export const percent = (fraction: number) => `${(fraction * 100).toFixed(1)}%`;

/** "https://expense-tracker.example/" → "expense-tracker.example" */
export function displayHost(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/+$/, "");
}
