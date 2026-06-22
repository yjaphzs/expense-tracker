import type { FieldValue, Timestamp } from "firebase/firestore";
import type {
  Transaction,
  Wallet,
  RecurringTransaction,
} from "./transaction";

export type {
  Transaction,
  Wallet,
  RecurringTransaction,
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
  autosave: boolean;
}

/** Profile document stored at `users/{uid}`. */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
