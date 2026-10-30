import type { TrackerState } from "@/types";
import { defaultGuestState, type TrackerField } from "@/lib/tracker-state";

/** localStorage key per field. The first four can be overridden per deployment. */
export const GUEST_KEYS: Record<TrackerField, string> = {
  transactions:
    process.env.NEXT_PUBLIC_APP_LOCAL_STORAGE_TRANSACTIONS_KEY || "expense_tracker_transactions",
  recurring: process.env.NEXT_PUBLIC_APP_LOCAL_STORAGE_RECURRING_KEY || "expense_tracker_recurring",
  wallets: process.env.NEXT_PUBLIC_APP_LOCAL_STORAGE_WALLETS_KEY || "expense-tracker-wallets",
  autosave: process.env.NEXT_PUBLIC_APP_LOCAL_STORAGE_AUTOSAVE_KEY || "expense_tracker_autosave",
  budgets: "expense_tracker_budgets",
  categories: "expense_tracker_categories",
};

const FIELDS = Object.keys(GUEST_KEYS) as TrackerField[];

/** The field a localStorage key belongs to, if any. */
export function fieldForKey(key: string | null): TrackerField | undefined {
  return FIELDS.find((field) => GUEST_KEYS[field] === key);
}

function readField<K extends TrackerField>(field: K, fallback: TrackerState[K]): TrackerState[K] {
  try {
    const raw = localStorage.getItem(GUEST_KEYS[field]);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    const ok = field === "autosave" ? typeof parsed === "boolean" : Array.isArray(parsed);
    return ok ? (parsed as TrackerState[K]) : fallback;
  } catch {
    return fallback;
  }
}

/** The saved guest state, or the defaults (one Cash wallet) for anything missing. */
export function readGuestState(): TrackerState {
  const defaults = defaultGuestState();
  if (typeof window === "undefined") return defaults;
  const state = { ...defaults };
  for (const field of FIELDS) {
    (state[field] as unknown) = readField(field, defaults[field]);
  }
  return state;
}

export function readGuestField<K extends TrackerField>(field: K): TrackerState[K] {
  return readField(field, defaultGuestState()[field]);
}

/** Writes the given fields (all by default). Failures (quota, private mode) are ignored. */
export function writeGuestState(state: TrackerState, fields: TrackerField[] = FIELDS): void {
  try {
    for (const field of fields) localStorage.setItem(GUEST_KEYS[field], JSON.stringify(state[field]));
  } catch {
    /* ignore */
  }
}
