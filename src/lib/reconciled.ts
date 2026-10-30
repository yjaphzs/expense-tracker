// Per-account flag (localStorage): the one-time local/cloud reconciliation has
// happened on this device, so the merge prompt never shows again for this
// account in this browser.
const RECONCILED_KEY_PREFIX = "expense_tracker_reconciled_";

export function isReconciled(uid: string): boolean {
  try {
    return localStorage.getItem(RECONCILED_KEY_PREFIX + uid) === "true";
  } catch {
    return false;
  }
}

export function markReconciled(uid: string): void {
  try {
    localStorage.setItem(RECONCILED_KEY_PREFIX + uid, "true");
  } catch {
    /* ignore */
  }
}
