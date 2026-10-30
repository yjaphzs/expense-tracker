"use client";

import { useCallback, useEffect, useRef, useState, type SetStateAction } from "react";

import { fieldForKey, readGuestField, readGuestState, writeGuestState } from "@/lib/guest-storage";
import type { TrackerField } from "@/lib/tracker-state";
import type { TrackerState } from "@/types";

export type FieldSetter = <K extends TrackerField>(field: K, value: SetStateAction<TrackerState[K]>) => void;

function resolve<T>(value: SetStateAction<T>, previous: T): T {
  return typeof value === "function" ? (value as (prev: T) => T)(previous) : value;
}

/**
 * Guest data in localStorage. With autosave off, edits stay in memory until
 * Save (the autosave flag itself is always written). Functional updates apply
 * to the latest in-memory state, so back-to-back edits (the two legs of a
 * transfer, a batch of recurring items) can't overwrite each other.
 */
export function useGuestTrackerStore() {
  const [state, setState] = useState<TrackerState>(readGuestState);
  const stateRef = useRef(state);

  const setField = useCallback<FieldSetter>((field, value) => {
    const next = { ...stateRef.current, [field]: resolve(value, stateRef.current[field]) };
    stateRef.current = next;
    setState(next);
    if (field === "autosave" || next.autosave) writeGuestState(next, [field]);
  }, []);

  /** Replace everything and write it, regardless of autosave (import, QR, reset). */
  const replace = useCallback((next: TrackerState) => {
    stateRef.current = next;
    setState(next);
    writeGuestState(next);
  }, []);

  /** Write what's in memory now (Save). */
  const persist = useCallback(() => writeGuestState(stateRef.current), []);

  // Another tab changed a guest key: pick up the new value.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      const field = fieldForKey(event.key);
      if (!field) return;
      const next = { ...stateRef.current, [field]: readGuestField(field) };
      stateRef.current = next;
      setState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { state, stateRef, setField, replace, persist };
}
