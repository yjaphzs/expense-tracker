"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { useAuth } from "@/context/auth-provider";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  subscribeTrackerState,
  writeTrackerState,
} from "@/lib/firebase/firestore";
import type {
  Transaction,
  Wallet,
  RecurringTransaction,
  TrackerState,
} from "@/types";
import { DEFAULT_WALLETS } from "@/types/transaction";

const TRANSACTIONS_KEY =
  process.env.NEXT_PUBLIC_APP_LOCAL_STORAGE_TRANSACTIONS_KEY ||
  "expense_tracker_transactions";
const RECURRING_KEY =
  process.env.NEXT_PUBLIC_APP_LOCAL_STORAGE_RECURRING_KEY ||
  "expense_tracker_recurring";
const WALLETS_KEY =
  process.env.NEXT_PUBLIC_APP_LOCAL_STORAGE_WALLETS_KEY ||
  "expense-tracker-wallets";
const AUTOSAVE_KEY =
  process.env.NEXT_PUBLIC_APP_LOCAL_STORAGE_AUTOSAVE_KEY ||
  "expense_tracker_autosave";

// Debounce window for cloud writes — coalesces rapid edits into one write.
const CLOUD_WRITE_DEBOUNCE_MS = 600;

// Per-account flag (localStorage) marking that the one-time local↔cloud
// reconciliation has already happened on this device, so the merge prompt is
// never shown again for this account on this browser.
const RECONCILED_KEY_PREFIX = "expense_tracker_reconciled_";

function isReconciled(uid: string): boolean {
  try {
    return localStorage.getItem(RECONCILED_KEY_PREFIX + uid) === "true";
  } catch {
    return false;
  }
}

function markReconciled(uid: string): void {
  try {
    localStorage.setItem(RECONCILED_KEY_PREFIX + uid, "true");
  } catch {
    /* ignore */
  }
}

export interface MergeConflict {
  local: TrackerState;
  cloud: TrackerState;
}

export interface UseExpenseData {
  transactions: Transaction[];
  setTransactions: Dispatch<SetStateAction<Transaction[]>>;
  recurring: RecurringTransaction[];
  setRecurring: Dispatch<SetStateAction<RecurringTransaction[]>>;
  wallets: Wallet[];
  setWallets: Dispatch<SetStateAction<Wallet[]>>;
  autosave: boolean;
  setAutosave: Dispatch<SetStateAction<boolean>>;
  /** Replace the entire state at once (import / QR transfer / merge). */
  replaceAll: (state: TrackerState) => void;
  /** Force-persist the current state to the active store right now (Save). */
  persistNow: () => void;
  /** Reset everything (transactions, recurring → empty; wallets → default). */
  removeAll: () => void;
  /**
   * True while the initial data is loading — auth is still resolving, or (when
   * signed in) the first cloud snapshot hasn't arrived yet. Use it to show a
   * loader instead of flashing an empty state on reload.
   */
  loading: boolean;
  /** True while signed in (data is backed by the cloud, not localStorage). */
  isCloud: boolean;
  /** Pending first-sign-in conflict between local and cloud data, if any. */
  pendingMerge: MergeConflict | null;
  resolveMerge: (choice: "merge" | "cloud" | "local") => void;
}

/** A lone default Cash wallet doesn't count as "real" data worth reconciling. */
function hasData(s: TrackerState): boolean {
  return (
    s.transactions.length > 0 ||
    s.recurring.length > 0 ||
    s.wallets.some((w) => w.id !== "cash")
  );
}

/** Any content at all, including a lone default wallet — used to decide whether
 * to seed a brand-new (empty) cloud account from local rather than start blank. */
function isNonEmpty(s: TrackerState): boolean {
  return (
    s.transactions.length > 0 ||
    s.recurring.length > 0 ||
    s.wallets.length > 0
  );
}

function sameState(a: TrackerState, b: TrackerState): boolean {
  return (
    JSON.stringify(a.transactions) === JSON.stringify(b.transactions) &&
    JSON.stringify(a.recurring) === JSON.stringify(b.recurring) &&
    JSON.stringify(a.wallets) === JSON.stringify(b.wallets)
  );
}

function byId<T extends { id: string }>(local: T[], cloud: T[]): T[] {
  const map = new Map<string, T>();
  // Cloud first, then local overrides — local is what the user sees right now.
  for (const item of cloud) map.set(item.id, item);
  for (const item of local) map.set(item.id, item);
  return [...map.values()];
}

function mergeStates(local: TrackerState, cloud: TrackerState): TrackerState {
  return {
    transactions: byId(local.transactions, cloud.transactions),
    recurring: byId(local.recurring, cloud.recurring),
    wallets: byId(local.wallets, cloud.wallets),
    autosave: cloud.autosave,
  };
}

/**
 * Unified persistence for the expense tracker. When signed out, data lives in
 * localStorage (unchanged guest behavior). When signed in, data lives in
 * Firestore with live sync + debounced writes, and a one-time merge prompt
 * reconciles any conflicting local data on first sign-in.
 */
export function useExpenseData(): UseExpenseData {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;

  // ── Guest store (localStorage) — also the merge source on first login. ─────
  const [lsAutosave, setLsAutosave] = useLocalStorage<boolean>(
    AUTOSAVE_KEY,
    true,
    { enabled: true },
  );
  const [lsTransactions, setLsTransactions] = useLocalStorage<Transaction[]>(
    TRANSACTIONS_KEY,
    [],
    { enabled: lsAutosave },
  );
  const [lsRecurring, setLsRecurring] = useLocalStorage<RecurringTransaction[]>(
    RECURRING_KEY,
    [],
    { enabled: lsAutosave },
  );
  const [lsWallets, setLsWallets] = useLocalStorage<Wallet[]>(
    WALLETS_KEY,
    DEFAULT_WALLETS,
    { enabled: lsAutosave },
  );

  // ── Cloud store ────────────────────────────────────────────────────────────
  const [cloud, setCloud] = useState<TrackerState>({
    transactions: [],
    recurring: [],
    wallets: [],
    autosave: true,
  });
  const [pendingMerge, setPendingMerge] = useState<MergeConflict | null>(null);
  // Whether the first cloud snapshot has arrived (only meaningful when signed in).
  const [cloudReady, setCloudReady] = useState(false);

  // Latest localStorage values, readable inside the subscription callback
  // without making it a dependency (which would re-subscribe on every edit).
  const lsRef = useRef<TrackerState>({
    transactions: lsTransactions,
    recurring: lsRecurring,
    wallets: lsWallets,
    autosave: lsAutosave,
  });
  useEffect(() => {
    lsRef.current = {
      transactions: lsTransactions,
      recurring: lsRecurring,
      wallets: lsWallets,
      autosave: lsAutosave,
    };
  }, [lsTransactions, lsRecurring, lsWallets, lsAutosave]);

  const cloudRef = useRef<TrackerState>(cloud);
  useEffect(() => {
    cloudRef.current = cloud;
  }, [cloud]);

  const autosaveRef = useRef(true);
  useEffect(() => {
    autosaveRef.current = uid ? cloud.autosave : lsAutosave;
  }, [uid, cloud.autosave, lsAutosave]);

  const cloudInitedRef = useRef(false);
  const writeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uidRef = useRef<string | null>(uid);
  useEffect(() => {
    uidRef.current = uid;
  }, [uid]);

  // Persist a state to the cloud (debounced). When autosave is off, only the
  // flag is written so the cloud keeps its last saved arrays (mirrors guest).
  const scheduleCloudWrite = useCallback((next: TrackerState) => {
    const currentUid = uidRef.current;
    if (!currentUid) return;
    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    writeTimerRef.current = setTimeout(() => {
      const payload: Partial<TrackerState> = next.autosave
        ? next
        : { autosave: next.autosave };
      writeTrackerState(currentUid, payload).catch((err) =>
        console.error("[useExpenseData] cloud write failed:", err),
      );
    }, CLOUD_WRITE_DEBOUNCE_MS);
  }, []);

  // ── Cloud subscription (per signed-in user) ────────────────────────────────
  useEffect(() => {
    setCloudReady(false);
    // Reset per-account state on EVERY account change (including a direct switch
    // between two signed-in users), so the next user's first snapshot always
    // runs reconciliation and flips cloudReady true (otherwise the app would
    // hang on the loading screen), and a stale merge prompt from the previous
    // account can't resolve against the new one.
    cloudInitedRef.current = false;
    setPendingMerge(null);
    if (!uid) {
      return;
    }

    const unsub = subscribeTrackerState(uid, (incoming, meta) => {
      if (!cloudInitedRef.current) {
        cloudInitedRef.current = true;
        setCloudReady(true);
        const local = lsRef.current;

        // Already reconciled on this device → adopt cloud, never prompt again.
        if (isReconciled(uid)) {
          setCloud(incoming);
          return;
        }

        if (hasData(incoming) && hasData(local) && !sameState(local, incoming)) {
          // Conflict — ask the user how to reconcile.
          setPendingMerge({ local, cloud: incoming });
          setCloud(incoming);
        } else if (!isNonEmpty(incoming) && isNonEmpty(local)) {
          // Fresh (empty) account — seed it from local so the user keeps their
          // guest data, including the default wallet, instead of starting blank.
          setCloud(local);
          writeTrackerState(uid, local).catch((err) =>
            console.error("[useExpenseData] initial push failed:", err),
          );
          markReconciled(uid);
        } else {
          // No conflict (cloud has data and local matches/empty, or both empty).
          setCloud(incoming);
          markReconciled(uid);
        }
        return;
      }

      // Subsequent live updates — real-time sync from OTHER devices. Skip the
      // echo of our own pending local writes (latency compensation).
      if (meta.hasPendingWrites) return;

      // Keep in-memory arrays when autosave is off.
      setCloud((prev) => ({
        transactions: autosaveRef.current ? incoming.transactions : prev.transactions,
        recurring: autosaveRef.current ? incoming.recurring : prev.recurring,
        wallets: autosaveRef.current ? incoming.wallets : prev.wallets,
        autosave: incoming.autosave,
      }));
    }, (err) => {
      // Snapshot error (e.g. rules not deployed / offline). Unblock the UI
      // instead of hanging on the loading screen forever; leave cloudInited
      // false so a recovered snapshot can still reconcile.
      console.error("[useExpenseData] tracker subscription error:", err);
      setCloudReady(true);
    });

    return () => {
      unsub();
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
  }, [uid]);

  // ── Cloud setters (mirror the useState dispatcher API) ─────────────────────
  const cloudSetTransactions = useCallback<
    Dispatch<SetStateAction<Transaction[]>>
  >(
    (value) => {
      setCloud((prev) => {
        const transactions =
          typeof value === "function"
            ? (value as (p: Transaction[]) => Transaction[])(prev.transactions)
            : value;
        const next = { ...prev, transactions };
        scheduleCloudWrite(next);
        return next;
      });
    },
    [scheduleCloudWrite],
  );

  const cloudSetRecurring = useCallback<
    Dispatch<SetStateAction<RecurringTransaction[]>>
  >(
    (value) => {
      setCloud((prev) => {
        const recurring =
          typeof value === "function"
            ? (value as (p: RecurringTransaction[]) => RecurringTransaction[])(
                prev.recurring,
              )
            : value;
        const next = { ...prev, recurring };
        scheduleCloudWrite(next);
        return next;
      });
    },
    [scheduleCloudWrite],
  );

  const cloudSetWallets = useCallback<Dispatch<SetStateAction<Wallet[]>>>(
    (value) => {
      setCloud((prev) => {
        const wallets =
          typeof value === "function"
            ? (value as (p: Wallet[]) => Wallet[])(prev.wallets)
            : value;
        const next = { ...prev, wallets };
        scheduleCloudWrite(next);
        return next;
      });
    },
    [scheduleCloudWrite],
  );

  const cloudSetAutosave = useCallback<Dispatch<SetStateAction<boolean>>>(
    (value) => {
      setCloud((prev) => {
        const autosave =
          typeof value === "function"
            ? (value as (p: boolean) => boolean)(prev.autosave)
            : value;
        const next = { ...prev, autosave };
        scheduleCloudWrite(next);
        return next;
      });
    },
    [scheduleCloudWrite],
  );

  // ── replaceAll / persistNow / removeAll ─────────────────────────────────────
  const writeGuest = useCallback((state: TrackerState) => {
    // Force-persist regardless of the autosave gate (import / QR / save / reset).
    try {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(state.transactions));
      localStorage.setItem(RECURRING_KEY, JSON.stringify(state.recurring));
      localStorage.setItem(WALLETS_KEY, JSON.stringify(state.wallets));
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state.autosave));
    } catch {
      /* ignore */
    }
  }, []);

  const replaceAll = useCallback(
    (state: TrackerState) => {
      if (uidRef.current) {
        setCloud(state);
        if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
        writeTrackerState(uidRef.current, state).catch((err) =>
          console.error("[useExpenseData] replaceAll failed:", err),
        );
      } else {
        setLsAutosave(state.autosave);
        setLsTransactions(state.transactions);
        setLsRecurring(state.recurring);
        setLsWallets(state.wallets);
        writeGuest(state);
      }
    },
    [setLsAutosave, setLsTransactions, setLsRecurring, setLsWallets, writeGuest],
  );

  const persistNow = useCallback(() => {
    if (uidRef.current) {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
      writeTrackerState(uidRef.current, cloudRef.current).catch((err) =>
        console.error("[useExpenseData] persistNow failed:", err),
      );
    } else {
      writeGuest(lsRef.current);
    }
  }, [writeGuest]);

  const removeAll = useCallback(() => {
    const reset: TrackerState = {
      transactions: [],
      recurring: [],
      // Clone so the in-memory/persisted state never aliases the shared constant.
      wallets: DEFAULT_WALLETS.map((w) => ({ ...w })),
      autosave: uidRef.current ? cloudRef.current.autosave : lsRef.current.autosave,
    };
    replaceAll(reset);
  }, [replaceAll]);

  const resolveMerge = useCallback((choice: "merge" | "cloud" | "local") => {
    setPendingMerge((conflict) => {
      if (!conflict || !uidRef.current) return null;
      const result =
        choice === "local"
          ? conflict.local
          : choice === "cloud"
            ? conflict.cloud
            : mergeStates(conflict.local, conflict.cloud);
      setCloud(result);
      writeTrackerState(uidRef.current, result).catch((err) =>
        console.error("[useExpenseData] merge resolve failed:", err),
      );
      markReconciled(uidRef.current);
      return null;
    });
  }, []);

  // Loading while auth is still resolving, or (signed in) until the first cloud
  // snapshot arrives — so the UI can show a loader instead of an empty flash.
  const loading = authLoading || (uid !== null && !cloudReady);

  // ── Unified facade ─────────────────────────────────────────────────────────
  if (uid) {
    return {
      transactions: cloud.transactions,
      setTransactions: cloudSetTransactions,
      recurring: cloud.recurring,
      setRecurring: cloudSetRecurring,
      wallets: cloud.wallets,
      setWallets: cloudSetWallets,
      autosave: cloud.autosave,
      setAutosave: cloudSetAutosave,
      replaceAll,
      persistNow,
      removeAll,
      loading,
      isCloud: true,
      pendingMerge,
      resolveMerge,
    };
  }

  return {
    transactions: lsTransactions,
    setTransactions: setLsTransactions,
    recurring: lsRecurring,
    setRecurring: setLsRecurring,
    wallets: lsWallets,
    setWallets: setLsWallets,
    autosave: lsAutosave,
    setAutosave: setLsAutosave,
    replaceAll,
    persistNow,
    removeAll,
    loading,
    isCloud: false,
    pendingMerge: null,
    resolveMerge,
  };
}
