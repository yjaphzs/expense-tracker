"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { writeTrackerState } from "@/lib/firebase/firestore";
import { setNearlyFull, setSyncState } from "@/lib/sync-status";
import { NEARLY_FULL_BYTES, stateSizeBytes } from "@/lib/tracker-state";
import type { TrackerState } from "@/types";

// Coalesces rapid edits into one write.
const DEBOUNCE_MS = 600;

type Payload = Partial<TrackerState>;

/**
 * Every cloud write for the tracker. Edits are debounced; explicit actions
 * (import, Save, merge) write right away. A queued write is flushed, never
 * dropped, when the page is hidden or the account changes. Progress goes to
 * the sync-status store for the account menu.
 */
export function useCloudWriter(uid: string | null) {
  const uidRef = useRef(uid);
  useEffect(() => {
    uidRef.current = uid;
  }, [uid]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ uid: string; payload: Payload } | null>(null);
  const inFlightRef = useRef(0);

  const writeNow = useCallback((targetUid: string, payload: Payload, label: string) => {
    inFlightRef.current += 1;
    setSyncState(navigator.onLine ? "saving" : "offline");
    if (payload.transactions) {
      const nearlyFull = stateSizeBytes(payload) > NEARLY_FULL_BYTES;
      setNearlyFull(nearlyFull);
      if (nearlyFull) {
        toast.warning("Your data is close to the storage limit", {
          id: "storage-nearly-full",
          description: "Export a backup, then remove old transactions you no longer need.",
        });
      }
    }
    writeTrackerState(targetUid, payload)
      .then(() => {
        inFlightRef.current -= 1;
        if (inFlightRef.current === 0 && uidRef.current === targetUid) setSyncState("saved");
      })
      .catch((err) => {
        inFlightRef.current -= 1;
        console.error(`[cloud writer] ${label} failed:`, err);
        // A failure for an account that's no longer signed in isn't news to anyone.
        if (uidRef.current !== targetUid) return;
        setSyncState("error");
        toast.error("Couldn't save to your account", {
          id: "cloud-write-error",
          description: "Your latest changes are on this device only. Check your connection and try again.",
        });
      });
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    const pending = pendingRef.current;
    pendingRef.current = null;
    if (pending) writeNow(pending.uid, pending.payload, "cloud write");
  }, [writeNow]);

  /** Explicit writes carry the full state, so a queued debounced write is moot. */
  const cancel = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingRef.current = null;
  }, []);

  /** Debounced write. With autosave off only the flag is written, so the account keeps its last saved data. */
  const schedule = useCallback(
    (next: TrackerState) => {
      const currentUid = uidRef.current;
      if (!currentUid) return;
      pendingRef.current = { uid: currentUid, payload: next.autosave ? next : { autosave: next.autosave } };
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(flush, DEBOUNCE_MS);
    },
    [flush],
  );

  // Phones often background or close the tab right after an edit.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [flush]);

  // Firestore holds writes made offline and sends them when the connection returns.
  useEffect(() => {
    const onOffline = () => setSyncState("offline");
    const onOnline = () => setSyncState(inFlightRef.current > 0 ? "saving" : "saved");
    if (!navigator.onLine) onOffline();
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return { uidRef, writeNow, flush, cancel, schedule };
}

export type CloudWriter = ReturnType<typeof useCloudWriter>;
