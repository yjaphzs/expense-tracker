import type { FieldValue, Timestamp } from "firebase/firestore";
import type {
  Transaction,
  Wallet,
  RecurringTransaction,
  Budget,
  CustomCategory,
} from "./transaction";

export type {
  Transaction,
  Wallet,
  RecurringTransaction,
  Budget,
  CustomCategory,
  TransactionType,
  WalletType,
  RecurrenceFrequency,
} from "./transaction";

/**
 * The full tracker state that is persisted — to localStorage for guests, or to
 * Firestore (`users/{uid}/tracker/state`) for signed-in users.
 */
export interface TrackerState {
  transactions: Transaction[];
  recurring: RecurringTransaction[];
  wallets: Wallet[];
  /** Added in 2.2.0; older saves, backups and QR payloads have none (read as []). */
  budgets: Budget[];
  /** Added in 2.2.0; see `budgets`. */
  categories: CustomCategory[];
  autosave: boolean;
}

/** Light, dark, or follow the device. */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Saved look (synced across the user's devices). `scheme` is a preset id from
 * lib/appearance/schemes.ts or "custom" with an `accent` "#rrggbb". Optional
 * keys are left out when unset (Firestore rejects `undefined`).
 */
export interface AppearancePreference {
  scheme: string;
  accent?: string;
  mode?: ThemeMode;
}

/** Profile document stored at `users/{uid}`. */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  /** Color scheme and light/dark choice; see AppearancePreference. */
  appearance?: AppearancePreference | null;
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
