// Per device: the first-run card was completed or skipped, so it doesn't come
// back while the tracker is still empty.
const KEY = "expense_tracker_onboarded";

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboarded(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}
