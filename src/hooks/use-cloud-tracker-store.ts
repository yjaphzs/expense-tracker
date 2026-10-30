"use client";

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

import type { FieldSetter } from "@/hooks/use-guest-tracker-store";
import type { CloudWriter } from "@/hooks/use-cloud-writer";
import { subscribeTrackerState } from "@/lib/firebase/firestore";
import { isReconciled, markReconciled } from "@/lib/reconciled";
import { emptyState, hasData, isNonEmpty, sameState, TRACKER_ARRAY_FIELDS } from "@/lib/tracker-state";
import type { TrackerState } from "@/types";

export interface MergeConflict {
  local: TrackerState;
  cloud: TrackerState;
}

/**
 * The signed-in user's tracker in Firestore (`users/{uid}/tracker/state`),
 * kept live with onSnapshot. The first snapshot on a device reconciles it with
 * the guest data: adopt, seed an empty account, or ask (`pendingMerge`).
 */
export function useCloudTrackerStore(
  uid: string | null,
  localRef: MutableRefObject<TrackerState>,
  writer: CloudWriter,
) {
  const [cloud, setCloud] = useState<TrackerState>(emptyState);
  const [cloudReady, setCloudReady] = useState(false);
  const [pendingMerge, setPendingMerge] = useState<MergeConflict | null>(null);
  const cloudRef = useRef(cloud);
  const initedRef = useRef(false);
  const { writeNow, flush, schedule } = writer;

  const apply = useCallback((next: TrackerState) => {
    cloudRef.current = next;
    setCloud(next);
  }, []);

  useEffect(() => {
    // Reset on EVERY account change (including a direct switch between two
    // users), so the next first snapshot reconciles and flips cloudReady.
    setCloudReady(false);
    initedRef.current = false;
    setPendingMerge(null);
    if (!uid) return;

    const unsubscribe = subscribeTrackerState(
      uid,
      (incoming, meta) => {
        if (!initedRef.current) {
          initedRef.current = true;
          setCloudReady(true);
          const local = localRef.current;
          if (isReconciled(uid)) {
            apply(incoming);
          } else if (hasData(incoming) && hasData(local) && !sameState(local, incoming)) {
            setPendingMerge({ local, cloud: incoming });
            apply(incoming);
          } else if (!isNonEmpty(incoming) && isNonEmpty(local)) {
            // A fresh account: seed it from this device instead of starting blank.
            apply(local);
            writeNow(uid, local, "initial push");
            markReconciled(uid);
          } else {
            apply(incoming);
            markReconciled(uid);
          }
          return;
        }
        // Live updates from other devices; skip the echo of our own writes.
        if (meta.hasPendingWrites) return;
        const prev = cloudRef.current;
        const next = { ...prev, autosave: incoming.autosave };
        // With autosave off, keep this device's unsaved edits.
        if (prev.autosave) for (const field of TRACKER_ARRAY_FIELDS) (next[field] as unknown) = incoming[field];
        apply(next);
      },
      (err) => {
        // Rules missing or offline: unblock the UI; a later snapshot can still reconcile.
        console.error("[cloud store] subscription error:", err);
        setCloudReady(true);
      },
    );

    return () => {
      unsubscribe();
      flush();
    };
  }, [uid, localRef, apply, writeNow, flush]);

  const setField = useCallback<FieldSetter>(
    (field, value) => {
      const prev = cloudRef.current;
      const resolved = typeof value === "function" ? (value as (p: unknown) => unknown)(prev[field]) : value;
      const next = { ...prev, [field]: resolved } as TrackerState;
      apply(next);
      schedule(next);
    },
    [apply, schedule],
  );

  return { cloud, cloudRef, cloudReady, apply, setField, pendingMerge, setPendingMerge };
}
