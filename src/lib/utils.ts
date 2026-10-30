import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const amountFormat = new Intl.NumberFormat("en-PH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const currencyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const compactCurrencyFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
})

/** A plain amount with no symbol, e.g. "1,234.50" (what the copy button copies). */
export function formatAmount(value: number): string {
  return amountFormat.format(value)
}

/** Peso amount for display, e.g. "₱1,234.50" or "-₱80.00". */
export function formatCurrency(value: number): string {
  return currencyFormat.format(value)
}

/** Short peso amount for chart axes, e.g. "₱12.5K". */
export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormat.format(value)
}
