import { useSyncExternalStore } from "react";

/**
 * Where a signed-in user's latest changes are. Written by the cloud writer
 * (src/hooks/use-cloud-writer.ts), read by the account menu. A tiny external
 * store because the two live in different parts of the tree.
 */
export type SyncState = "idle" | "saving" | "saved" | "offline" | "error";

export interface SyncSnapshot {
  state: SyncState;
  /** The saved data is close to Firestore's 1 MiB document limit. */
  nearlyFull: boolean;
}

let snapshot: SyncSnapshot = { state: "idle", nearlyFull: false };
let retry: (() => void) | null = null;
const listeners = new Set<() => void>();

function emit(next: Partial<SyncSnapshot>) {
  const merged = { ...snapshot, ...next };
  if (merged.state === snapshot.state && merged.nearlyFull === snapshot.nearlyFull) return;
  snapshot = merged;
  listeners.forEach((listener) => listener());
}

export function setSyncState(state: SyncState): void {
  emit({ state });
}

export function setNearlyFull(nearlyFull: boolean): void {
  emit({ nearlyFull });
}

export function getSyncSnapshot(): SyncSnapshot {
  return snapshot;
}

export function subscribeSync(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** What "Try again" in the account menu runs (a full save of the current state). */
export function setSyncRetry(handler: (() => void) | null): void {
  retry = handler;
}

export function retrySync(): void {
  retry?.();
}

const SERVER_SNAPSHOT: SyncSnapshot = { state: "idle", nearlyFull: false };

export function useSyncStatus(): SyncSnapshot {
  return useSyncExternalStore(subscribeSync, getSyncSnapshot, () => SERVER_SNAPSHOT);
}
