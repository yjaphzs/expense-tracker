import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";

import { enforceRateLimit } from "../rate-limit";

/**
 * Resend's free plan caps sends (100/day, 3,000/month). Two guards keep the app
 * inside it, and both make the client fall back to Firebase Auth's built-in
 * emails instead of failing:
 *   - a global daily budget, so nobody can drain the quota (the per-IP limit
 *     can be sidestepped with a spoofed X-Forwarded-For);
 *   - remembering when Resend itself refused a send for quota reasons.
 */
const DAILY_EMAIL_BUDGET = 90;

/** Resend error name → how long to stop trying Resend, in seconds. */
const QUOTA_BACKOFF: Record<string, number> = {
  rate_limit_exceeded: 60,
  daily_quota_exceeded: 60 * 60,
  monthly_quota_exceeded: 6 * 60 * 60,
};

/** Server-only doc in the rate-limit collection, which the rules deny to clients. */
const QUOTA_DOC = "rateLimits/email_quota";

export class EmailQuotaError extends Error {
  constructor(readonly code: string) {
    super(`Email provider quota reached (${code}).`);
    this.name = "EmailQuotaError";
  }
}

/** The quota error for a Resend error name, or null for any other failure. */
export function quotaErrorFor(name: string | undefined): EmailQuotaError | null {
  return name && name in QUOTA_BACKOFF ? new EmailQuotaError(name) : null;
}

async function isEmailQuotaExhausted(): Promise<boolean> {
  const until = (await getFirestore().doc(QUOTA_DOC).get()).data()?.exhaustedUntil;
  return until instanceof Timestamp && until.toMillis() > Date.now();
}

/**
 * Claims one send from today's budget. False means "use the fallback": the
 * budget is spent, or Resend recently refused for quota reasons.
 */
export async function reserveEmailSlot(): Promise<boolean> {
  if (await isEmailQuotaExhausted()) return false;
  try {
    await enforceRateLimit({ key: "email_daily_budget", max: DAILY_EMAIL_BUDGET, windowSec: 24 * 60 * 60 });
    return true;
  } catch (err) {
    if (err instanceof HttpsError && err.code === "resource-exhausted") return false;
    throw err;
  }
}

/** Best-effort: a failed write only means the next request tries Resend again. */
export async function markEmailQuotaExhausted(err: EmailQuotaError): Promise<void> {
  const seconds = QUOTA_BACKOFF[err.code] ?? 60 * 60;
  const until = Date.now() + seconds * 1000;
  await getFirestore()
    .doc(QUOTA_DOC)
    .set({ code: err.code, exhaustedUntil: Timestamp.fromMillis(until), expireAt: new Date(until) })
    .catch(() => undefined);
}

/**
 * Tells the client to send Firebase's built-in email instead. The client checks
 * `details.fallback === "firebase"` (see src/lib/firebase/email-delivery.ts).
 */
export function emailFallbackError(): HttpsError {
  return new HttpsError("unavailable", "Email service is busy.", { fallback: "firebase" });
}
