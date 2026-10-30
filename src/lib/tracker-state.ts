import type { TrackerState } from "@/types";
import { DEFAULT_WALLETS } from "@/types/transaction";

/**
 * Every array in the tracker state. Normalizing, comparing, merging, guest
 * storage and import all go through this list, so a new array field is added
 * here (plus its type and guest key) rather than in a dozen places.
 */
export const TRACKER_ARRAY_FIELDS = [
  "transactions",
  "recurring",
  "wallets",
  "budgets",
  "categories",
] as const;

export type TrackerArrayField = (typeof TRACKER_ARRAY_FIELDS)[number];
export type TrackerField = TrackerArrayField | "autosave";

export function emptyState(): TrackerState {
  return { transactions: [], recurring: [], wallets: [], budgets: [], categories: [], autosave: true };
}

/** What a brand-new guest starts with: one Cash wallet (cloned, never the shared constant). */
export function defaultGuestState(): TrackerState {
  return { ...emptyState(), wallets: DEFAULT_WALLETS.map((wallet) => ({ ...wallet })) };
}

/**
 * Coerces a stored or imported object into a full state. Missing arrays (older
 * saves, backups and QR payloads have no budgets or categories) become [].
 */
export function normalizeState(data: Record<string, unknown> | null | undefined): TrackerState {
  const state = emptyState();
  if (!data) return state;
  for (const field of TRACKER_ARRAY_FIELDS) {
    const value = data[field];
    if (Array.isArray(value)) (state[field] as unknown[]) = value;
  }
  if (typeof data.autosave === "boolean") state.autosave = data.autosave;
  return state;
}

/** A lone default Cash wallet doesn't count as "real" data worth reconciling. */
export function hasData(state: TrackerState): boolean {
  return TRACKER_ARRAY_FIELDS.some((field) =>
    field === "wallets"
      ? state.wallets.some((wallet) => wallet.id !== "cash")
      : state[field].length > 0,
  );
}

/** Any content at all, including a lone default wallet: worth seeding an empty account with. */
export function isNonEmpty(state: TrackerState): boolean {
  return TRACKER_ARRAY_FIELDS.some((field) => state[field].length > 0);
}

export function sameState(a: TrackerState, b: TrackerState): boolean {
  return TRACKER_ARRAY_FIELDS.every((field) => JSON.stringify(a[field]) === JSON.stringify(b[field]));
}

function byId<T extends { id: string }>(local: T[], cloud: T[]): T[] {
  const map = new Map<string, T>();
  // Cloud first, then local overrides: local is what the user sees right now.
  for (const item of cloud) map.set(item.id, item);
  for (const item of local) map.set(item.id, item);
  return [...map.values()];
}

/** Union of both sides by id (local wins on the same id); autosave follows the account. */
export function mergeStates(local: TrackerState, cloud: TrackerState): TrackerState {
  const merged = { ...cloud };
  for (const field of TRACKER_ARRAY_FIELDS) {
    (merged[field] as { id: string }[]) = byId<{ id: string }>(local[field], cloud[field]);
  }
  return merged;
}

// Firestore caps a document at 1 MiB; warn well before a save can fail.
export const NEARLY_FULL_BYTES = 800_000;

/** Approximate stored size of the state, in bytes (UTF-8 JSON). */
export function stateSizeBytes(state: Partial<TrackerState>): number {
  return new TextEncoder().encode(JSON.stringify(state)).length;
}
