import type { TrackerState } from "@/types";
import { normalizeState } from "@/lib/tracker-state";

type Check = (value: unknown) => boolean;

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const has = (v: Record<string, unknown>, key: string, type: "string" | "number" | "boolean") => typeof v[key] === type;

const isTransaction: Check = (v) =>
  isObject(v) &&
  has(v, "id", "string") &&
  has(v, "type", "string") &&
  has(v, "category", "string") &&
  has(v, "amount", "number") &&
  has(v, "date", "string") &&
  has(v, "walletId", "string");

const isWallet: Check = (v) => isObject(v) && has(v, "id", "string") && has(v, "name", "string") && has(v, "type", "string");

const isRecurring: Check = (v) =>
  isObject(v) &&
  has(v, "id", "string") &&
  has(v, "type", "string") &&
  has(v, "category", "string") &&
  has(v, "amount", "number") &&
  has(v, "frequency", "string");

const isBudget: Check = (v) =>
  isObject(v) && has(v, "id", "string") && has(v, "amount", "number") && (v.category === undefined || has(v, "category", "string"));

const isCategory: Check = (v) =>
  isObject(v) && has(v, "id", "string") && has(v, "name", "string") && has(v, "type", "string") && has(v, "icon", "string");

// Required in every backup; budgets and categories (2.2.0+) may be missing.
const REQUIRED: [keyof TrackerState, Check][] = [
  ["transactions", isTransaction],
  ["wallets", isWallet],
  ["recurring", isRecurring],
];
const OPTIONAL: [keyof TrackerState, Check][] = [
  ["budgets", isBudget],
  ["categories", isCategory],
];

export class ImportError extends Error {}

/**
 * Checks a parsed backup (JSON file or QR payload) and returns a full state.
 * Throws ImportError naming the first problem. `fallbackAutosave` is used when
 * the payload has no autosave flag (QR payloads may not).
 */
export function validateBackup(parsed: unknown, fallbackAutosave?: boolean): TrackerState {
  if (!isObject(parsed)) throw new ImportError("This file isn't an Expense Tracker backup.");
  for (const [field, check] of REQUIRED) {
    const value = parsed[field];
    if (!Array.isArray(value) || !value.every(check)) throw new ImportError(`Missing or invalid "${field}".`);
  }
  for (const [field, check] of OPTIONAL) {
    const value = parsed[field];
    if (value !== undefined && (!Array.isArray(value) || !value.every(check))) {
      throw new ImportError(`Invalid "${field}".`);
    }
  }
  const autosave = typeof parsed.autosave === "boolean" ? parsed.autosave : fallbackAutosave;
  if (typeof autosave !== "boolean") throw new ImportError(`Missing or invalid "autosave".`);
  return { ...normalizeState(parsed), autosave };
}

/** The backup file's contents: every field, pretty-printed. */
export function serializeBackup(state: TrackerState): string {
  const { transactions, recurring, wallets, budgets, categories, autosave } = state;
  return JSON.stringify({ transactions, recurring, wallets, budgets, categories, autosave }, null, 2);
}
