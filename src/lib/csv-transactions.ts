import { parseCsv, toCsv } from "@/lib/csv";
import { builtInCategories, MAX_CATEGORY_NAME } from "@/lib/categories";
import type { CustomCategory, Transaction, TransactionType, Wallet } from "@/types/transaction";
import { isTransfer } from "@/types/transaction";

export const CSV_COLUMNS = ["Date", "Type", "Category", "Description", "Amount", "Wallet"] as const;

function typeLabel(t: Transaction): string {
  if (isTransfer(t)) return t.type === "expense" ? "Transfer out" : "Transfer in";
  return t.type === "income" ? "Income" : "Expense";
}

/** Transactions as CSV, newest first. Amounts are plain numbers so spreadsheets can sum them. */
export function transactionsToCsv(transactions: Transaction[], wallets: Wallet[]): string {
  const walletName = new Map(wallets.map((w) => [w.id, w.name]));
  const rows = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => [t.date, typeLabel(t), t.category, t.description, t.amount.toFixed(2), walletName.get(t.walletId) ?? ""]);
  return toCsv([[...CSV_COLUMNS], ...rows]);
}

export interface CsvImportResult {
  transactions: Omit<Transaction, "id">[];
  newWallets: Wallet[];
  newCategories: CustomCategory[];
  skipped: { row: number; reason: string }[];
}

export class CsvFormatError extends Error {}

/** "2026-10-31", or "10/31/2026" (month first, as Excel writes US dates). */
function parseDate(value: string): string | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  const parts = iso ? [iso[1], iso[2], iso[3]] : us ? [us[3], us[1], us[2]] : null;
  if (!parts) return null;
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(+y, +m - 1, +d));
  if (date.getUTCMonth() !== +m - 1 || date.getUTCDate() !== +d) return null;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseAmount(value: string): number | null {
  const amount = Math.abs(Number(value.replace(/[₱,\s]|PHP/gi, "")));
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

/**
 * Reads transactions from CSV with a header row (Date, Type, Category,
 * Amount, Wallet; Description optional; any order, any case). Unknown wallets
 * and categories are created; transfers and bad rows are skipped with a reason.
 */
export function parseTransactionsCsv(text: string, wallets: Wallet[], custom: CustomCategory[]): CsvImportResult {
  const [header, ...rows] = parseCsv(text);
  const index = (name: string) => (header ?? []).findIndex((h) => h.trim().toLowerCase() === name);
  const col = { date: index("date"), type: index("type"), category: index("category"), amount: index("amount"), wallet: index("wallet"), description: index("description") };
  if ([col.date, col.type, col.amount, col.wallet].some((i) => i < 0)) {
    throw new CsvFormatError("The first row must name the columns: Date, Type, Category, Amount, Wallet (Description is optional).");
  }

  const result: CsvImportResult = { transactions: [], newWallets: [], newCategories: [], skipped: [] };
  const walletByName = new Map(wallets.map((w) => [w.name.toLowerCase(), w.id]));
  const knownCategory = (type: TransactionType, name: string) =>
    [...builtInCategories(type), ...[...custom, ...result.newCategories].filter((c) => c.type === type).map((c) => c.name)].find(
      (c) => c.toLowerCase() === name.toLowerCase(),
    );

  rows.forEach((cells, i) => {
    const row = i + 2; // 1-based, after the header
    const cell = (at: number) => (at >= 0 ? (cells[at] ?? "").trim() : "");
    const rawType = cell(col.type).toLowerCase();
    if (rawType.startsWith("transfer")) return result.skipped.push({ row, reason: "transfers aren't imported" });
    if (rawType !== "income" && rawType !== "expense") return result.skipped.push({ row, reason: "type must be Income or Expense" });
    const type = rawType as TransactionType;
    const date = parseDate(cell(col.date));
    if (!date) return result.skipped.push({ row, reason: "date isn't YYYY-MM-DD or M/D/YYYY" });
    const amount = parseAmount(cell(col.amount));
    if (amount === null) return result.skipped.push({ row, reason: "missing or invalid amount" });
    const walletName = cell(col.wallet);
    if (!walletName) return result.skipped.push({ row, reason: "missing wallet" });

    let walletId = walletByName.get(walletName.toLowerCase());
    if (!walletId) {
      const wallet: Wallet = { id: crypto.randomUUID(), name: walletName, type: walletName.toLowerCase() === "cash" ? "cash" : "e-wallet-card" };
      result.newWallets.push(wallet);
      walletByName.set(walletName.toLowerCase(), wallet.id);
      walletId = wallet.id;
    }

    const rawCategory = cell(col.category).slice(0, MAX_CATEGORY_NAME) || "Other";
    let category = knownCategory(type, rawCategory);
    if (!category) {
      result.newCategories.push({ id: crypto.randomUUID(), name: rawCategory, type, icon: "other" });
      category = rawCategory;
    }

    result.transactions.push({ type, category, amount, date, walletId, description: cell(col.description).slice(0, 100) });
  });
  return result;
}
