import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type DocumentReference,
} from 'firebase/firestore';
import { db } from './client';
import type { User } from './auth';
import type { TrackerState, UserProfile } from '@/types';

// ── Document references ─────────────────────────────────────────────────────
export function userProfileRef(uid: string): DocumentReference {
  return doc(db, 'users', uid);
}

export function trackerStateRef(uid: string): DocumentReference {
  return doc(db, 'users', uid, 'tracker', 'state');
}

// ── Profile ─────────────────────────────────────────────────────────────────
/** Reads the profile document once. Returns null if it doesn't exist yet. */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userProfileRef(uid));
  return snap.exists() ? ({ uid, ...snap.data() } as UserProfile) : null;
}

/**
 * Creates the profile document on first sign-in if it's missing. Idempotent —
 * safe to call after every login. Returns nothing; the live subscription in the
 * AuthProvider picks up the change.
 */
export async function ensureUserProfile(user: User): Promise<void> {
  const ref = userProfileRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    email: user.email ?? '',
    displayName: user.displayName ?? null,
    photoURL: user.photoURL ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** Merges fields into the profile document. */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'email'>>,
): Promise<void> {
  await setDoc(
    userProfileRef(uid),
    { ...data, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// ── Tracker state ─────────────────────────────────────────────────────────────
const EMPTY_STATE: TrackerState = {
  transactions: [],
  recurring: [],
  wallets: [],
  autosave: true,
};

function normalizeState(data: Record<string, unknown>): TrackerState {
  return {
    transactions: Array.isArray(data.transactions) ? data.transactions : [],
    recurring: Array.isArray(data.recurring) ? data.recurring : [],
    wallets: Array.isArray(data.wallets) ? data.wallets : [],
    autosave: typeof data.autosave === 'boolean' ? data.autosave : true,
  };
}

/** Reads the tracker state once. Returns null when nothing is saved yet. */
export async function getTrackerState(
  uid: string,
): Promise<TrackerState | null> {
  const snap = await getDoc(trackerStateRef(uid));
  if (!snap.exists()) return null;
  return normalizeState(snap.data());
}

/**
 * Writes the tracker state. Accepts a partial so callers can persist only some
 * fields (e.g. just the autosave flag while leaving the arrays untouched when
 * autosave is off) — the write is a merge, so omitted fields are preserved.
 */
export async function writeTrackerState(
  uid: string,
  state: Partial<TrackerState>,
): Promise<void> {
  await setDoc(
    trackerStateRef(uid),
    { ...state, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export interface SnapshotMeta {
  /** True when this snapshot reflects this client's own un-acknowledged write
   *  (latency compensation) — i.e. an echo of a local change, not a remote one. */
  hasPendingWrites: boolean;
}

/**
 * Live subscription to the tracker state. Invokes `callback` with the current
 * state (or the empty default when no document exists yet) plus the snapshot
 * metadata, so callers can distinguish remote changes from the echo of their
 * own local writes.
 */
export function subscribeTrackerState(
  uid: string,
  callback: (state: TrackerState, meta: SnapshotMeta) => void,
  onError?: (err: Error) => void,
): () => void {
  return onSnapshot(
    trackerStateRef(uid),
    (snap) => {
      const meta: SnapshotMeta = {
        hasPendingWrites: snap.metadata.hasPendingWrites,
      };
      if (!snap.exists()) {
        callback(EMPTY_STATE, meta);
        return;
      }
      callback(normalizeState(snap.data()), meta);
    },
    (err) => {
      console.error('[firestore] tracker snapshot error:', err);
      onError?.(err);
    },
  );
}
