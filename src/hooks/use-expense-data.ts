"use client";

import { useCallback, useEffect, type Dispatch, type SetStateAction } from "react";

import { useAuth } from "@/context/auth-provider";
import { useCloudTrackerStore, type MergeConflict } from "@/hooks/use-cloud-tracker-store";
import { useCloudWriter } from "@/hooks/use-cloud-writer";
import { useGuestTrackerStore } from "@/hooks/use-guest-tracker-store";
import { markReconciled } from "@/lib/reconciled";
import { setSyncRetry, setSyncState } from "@/lib/sync-status";
import { defaultGuestState, mergeStates, type TrackerField } from "@/lib/tracker-state";
import type { TrackerState } from "@/types";

export type { MergeConflict };

type Setter<K extends TrackerField> = Dispatch<SetStateAction<TrackerState[K]>>;

export interface UseExpenseData extends TrackerState {
  setTransactions: Setter<"transactions">;
  setRecurring: Setter<"recurring">;
  setWallets: Setter<"wallets">;
  setBudgets: Setter<"budgets">;
  setCategories: Setter<"categories">;
  setAutosave: Setter<"autosave">;
  /** Replace the entire state at once (import / QR transfer / merge). */
  replaceAll: (state: TrackerState) => void;
  /** Force-persist the current state to the active store right now (Save). */
  persistNow: () => void;
  /** Reset everything: no transactions, recurring, budgets or categories; one Cash wallet. */
  removeAll: () => void;
  /** Auth is resolving, or (signed in) the first cloud snapshot hasn't arrived. */
  loading: boolean;
  /** Signed in: data is backed by Firestore, not localStorage. */
  isCloud: boolean;
  /** Pending first-sign-in conflict between local and cloud data, if any. */
  pendingMerge: MergeConflict | null;
  resolveMerge: (choice: "merge" | "cloud" | "local") => void;
}

/**
 * Unified persistence. Signed out, data lives in localStorage
 * (use-guest-tracker-store); signed in, in Firestore with live sync and
 * debounced writes (use-cloud-tracker-store + use-cloud-writer). Components get
 * the same useState-like API either way.
 */
export function useExpenseData(): UseExpenseData {
  const { user, loading: authLoading } = useAuth();
  const uid = user?.uid ?? null;

  const guest = useGuestTrackerStore();
  const writer = useCloudWriter(uid);
  const cloud = useCloudTrackerStore(uid, guest.stateRef, writer);
  const { writeNow, cancel, uidRef } = writer;
  const { replace: guestReplace, persist: guestPersist, stateRef: guestRef } = guest;

  const setField = uid ? cloud.setField : guest.setField;
  const setTransactions = useCallback<Setter<"transactions">>((v) => setField("transactions", v), [setField]);
  const setRecurring = useCallback<Setter<"recurring">>((v) => setField("recurring", v), [setField]);
  const setWallets = useCallback<Setter<"wallets">>((v) => setField("wallets", v), [setField]);
  const setBudgets = useCallback<Setter<"budgets">>((v) => setField("budgets", v), [setField]);
  const setCategories = useCallback<Setter<"categories">>((v) => setField("categories", v), [setField]);
  const setAutosave = useCallback<Setter<"autosave">>((v) => setField("autosave", v), [setField]);

  const { apply, cloudRef, setPendingMerge } = cloud;
  const replaceAll = useCallback(
    (state: TrackerState) => {
      const currentUid = uidRef.current;
      if (!currentUid) return guestReplace(state);
      apply(state);
      cancel();
      writeNow(currentUid, state, "replaceAll");
    },
    [uidRef, guestReplace, apply, cancel, writeNow],
  );

  const persistNow = useCallback(() => {
    const currentUid = uidRef.current;
    if (!currentUid) return guestPersist();
    cancel();
    writeNow(currentUid, cloudRef.current, "persistNow");
  }, [uidRef, guestPersist, cancel, writeNow, cloudRef]);

  const removeAll = useCallback(() => {
    const autosave = uidRef.current ? cloudRef.current.autosave : guestRef.current.autosave;
    replaceAll({ ...defaultGuestState(), autosave });
  }, [uidRef, cloudRef, guestRef, replaceAll]);

  const resolveMerge = useCallback(
    (choice: "merge" | "cloud" | "local") => {
      const conflict = cloud.pendingMerge;
      const currentUid = uidRef.current;
      setPendingMerge(null);
      if (!conflict || !currentUid) return;
      const result =
        choice === "local" ? conflict.local : choice === "cloud" ? conflict.cloud : mergeStates(conflict.local, conflict.cloud);
      apply(result);
      writeNow(currentUid, result, "merge resolve");
      markReconciled(currentUid);
    },
    [cloud.pendingMerge, uidRef, setPendingMerge, apply, writeNow],
  );

  // The account menu's "Try again" re-sends everything; guests have no sync status.
  useEffect(() => {
    if (!uid) setSyncState("idle");
    setSyncRetry(uid ? persistNow : null);
    return () => setSyncRetry(null);
  }, [uid, persistNow]);

  const state = uid ? cloud.cloud : guest.state;
  return {
    ...state,
    setTransactions,
    setRecurring,
    setWallets,
    setBudgets,
    setCategories,
    setAutosave,
    replaceAll,
    persistNow,
    removeAll,
    loading: authLoading || (uid !== null && !cloud.cloudReady),
    isCloud: uid !== null,
    pendingMerge: uid ? cloud.pendingMerge : null,
    resolveMerge,
  };
}
