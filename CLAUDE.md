# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend (root)**
```bash
npm run dev          # Dev server (no static export, hot reload)
npm run build        # Production static export → ./out
npm run lint         # ESLint
npm run typecheck    # TypeScript type check (no emit)
```

**Cloud Functions (`functions/`)**
```bash
cd functions
npm run build              # Compile TypeScript → lib/
npm run generate:emails    # Rebuild HTML email templates from .hbs sources
npm run lint               # ESLint for functions
```

**Firebase emulators (optional)**
```bash
firebase emulators:start   # Auth, Firestore, Storage, Functions, Hosting
```

## Architecture

### Frontend (Next.js App Router + static export)

The app is **entirely client-rendered** and deployed as a static export (`output: 'export'` in production only — `npm run dev` runs a normal Next.js server). All data fetching and Firebase interaction happens in the browser.

**Route layout:**
- `/` — main tracker (public, no auth required)
- `/(auth)/login`, `/register`, `/forgot-password` — guest-only pages (redirect signed-in users away)
- `/account` — auth-only profile management
- `/auth/action` — handles Firebase email action links (verify email, reset password)
- `/(legal)/privacy-policy`, `/terms-and-conditions` — static legal pages

Route guards live in [`src/components/auth-guard.tsx`](src/components/auth-guard.tsx) and [`src/components/guest-guard.tsx`](src/components/guest-guard.tsx). Route name constants are in [`src/config/routes.ts`](src/config/routes.ts).

### Data persistence — dual-mode (the core design)

The central hook is [`src/hooks/use-expense-data.ts`](src/hooks/use-expense-data.ts). It presents a **single unified API** (`transactions`, `setTransactions`, `wallets`, etc.) regardless of whether the user is signed in:

- **Guest**: reads/writes from `localStorage` via `useLocalStorage`
- **Signed in**: real-time Firestore subscription (`users/{uid}/tracker/state`) with debounced writes (600 ms)

On first sign-in, if both local and cloud have data, `useExpenseData` surfaces a `pendingMerge` conflict resolved by [`MergeDialog`](src/components/smart/merge-dialog.tsx) — the user picks "keep local", "keep cloud", or "merge both". A per-account `localStorage` flag (`expense_tracker_reconciled_{uid}`) prevents the prompt from showing again on the same device.

All consuming components (in `src/components/smart/`) receive data through this hook and are unaware of where the data lives.

A pending debounced write is **flushed, not dropped**, when the page is hidden, closed, or the user signs out. A failed cloud write shows an error toast (the account menu says "Cloud sync on", not "Synced", for that reason).

Transfers are two transactions (an expense leg and an income leg) sharing a `transferId`. `transferPartner()` in [`src/types/transaction.ts`](src/types/transaction.ts) finds the other leg (older transfers without `transferId` are paired by date, amount, and wallets). Deleting either leg deletes both, and Undo restores both.

### Auth state

[`src/context/auth-provider.tsx`](src/context/auth-provider.tsx) exports `AuthProvider` and `useAuth()`. It exposes `{ user, profile, loading }`:
- `user` — Firebase Auth user object
- `profile` — live snapshot of `users/{uid}` Firestore doc (`UserProfile` type)
- `loading` — true while the initial auth state resolves

### Firebase client SDK (`src/lib/firebase/`)

All Firebase service access goes through wrappers in this directory — never import from `firebase/*` directly in components:
- `client.ts` — initializes the Firebase app (singleton). **App Check starts on demand** (`ensureAppCheck`): on the auth pages (`AppCheckActivator`), once a user signs in, and at load **before `getAuth()`** when the browser had a signed-in session (the `expense_tracker_session_hint` flag `AuthProvider` keeps). That early start is required: with App Check enforced, Auth's session re-check on load fails without a token and signs the user out. Guests never load reCAPTCHA (free tier: 10,000 assessments a month), so don't start it at import time.
- `email-delivery.ts` — `deliverVerificationEmail()` / `deliverPasswordReset()`. Use these, not the raw callables: they fall back to Firebase Auth's built-in emails when the Resend quota is used up.
- `auth.ts` — auth helpers (`signIn`, `signOut`, `onAuthChange`, etc.)
- `firestore.ts` — Firestore helpers including `subscribeTrackerState`, `writeTrackerState`, `ensureUserProfile`
- `storage.ts` — Storage upload/download helpers
- `callable.ts` — typed wrappers for the three Cloud Functions
- `index.ts` — re-exports the public API

### Firestore schema

```
users/{uid}                    # UserProfile doc
users/{uid}/tracker/state      # TrackerState doc (transactions, wallets, recurring, autosave)
rateLimits/{bucketId}          # Server-only; clients denied by rules. TTL on expireAt
```

`firestore.indexes.json` exempts the tracker arrays (`transactions`, `recurring`, `wallets`) from indexing (nothing queries them) and sets the `rateLimits.expireAt` TTL. `storage.rules` only allows an owner's `users/{uid}/avatar` image, up to 1 MB.

`TrackerState` (defined in [`src/types/index.ts`](src/types/index.ts)) is a single Firestore document containing all three data arrays. The subcollection keeps the profile doc small and the subscription narrow.

### Cloud Functions (`functions/src/`)

Three callable HTTPS functions, all deployed to `asia-southeast1` (co-located with Firestore):
- `deleteAccount` — atomically deletes Auth user + Firestore + Storage data
- `sendVerificationEmail` — generates a Firebase action link and sends branded HTML via Resend
- `sendPasswordResetEmail` — same pattern

**Email quota fallback** ([`functions/src/lib/email/quota.ts`](functions/src/lib/email/quota.ts)): Resend's free plan allows 100 emails a day. Each send first claims a slot from a global daily budget (90, so spoofed IPs can't drain it) and checks whether Resend recently refused for quota reasons (`rateLimits/email_quota`). Either case tells the client to send Firebase's built-in email instead (`unavailable` with `details.fallback === "firebase"` for verification, `{ fallback: true }` for reset).

Email HTML is pre-built from Handlebars templates in `functions/src/lib/email/templates/` using mailwind (Tailwind v3 inline styles). Run `npm run generate:emails` inside `functions/` to rebuild `generated-templates.ts` after changing `.hbs` files.

### UI components

- `src/components/ui/` — shadcn/ui primitives (auto-generated; edit with care)
- `src/components/smart/` — business-logic components (dialogs, lists, analytics, export)
- `src/components/shared/` — generic building blocks (responsive dialog/menu, bottom tab bar, floating Add button)
- `src/components/dom/` — third-party wrappers (Ko-fi button)

**Phones (below `md`; desktop is unchanged):**
- **Overlays:** tasks (forms, menus, pickers) open as bottom sheets via `shared/responsive-dialog.tsx` and `shared/responsive-menu.tsx` (vaul drawer on phones, Radix dialog/dropdown from `md` up). Form footers use `shared/form-dialog-actions.tsx` (primary first in a sheet). Confirmations stay `AlertDialog`s.
- **Shell:** `page.tsx` hides the top tabs and shows `BottomTabBar` plus a section-specific `FloatingAddButton` (none on Analytics). The section lives in `?tab=` (`hooks/use-url-tab.ts`). The `viewport` export sets `viewportFit: "cover"` for the safe-area padding, and toasts sit above the bar via `--toast-bottom` in `globals.css`.
- **Rows:** tapping a transaction or recurring row opens its action sheet; the inline buttons are `md` and up only. Deleting a transaction is immediate with an Undo toast.
- **Touch targets:** icon buttons are 40px on phones (`max-md:size-10`).

**Money:** `formatCurrency` shows pesos (`₱1,234.50`), `formatCompactCurrency` is for chart axes (`₱12.5K`), and `formatAmount` is the plain number the copy button copies. Amount inputs use `inputMode="decimal"`.

**Loading:** Analytics (recharts), Excel export (`xlsx-js-style`), and the QR dialog are loaded on first use. The service worker precaches only the `/` shell; other assets are cached as they're used (`pwa-register.tsx` hands the worker the files the page already loaded, so offline works after the first visit). It never reloads the page when the connection returns.

### Environment variables

Copy `.env.local.example` → `.env.local` for frontend Firebase config. Copy `functions/.env.example` → `functions/.env` for Resend + email config. The `NEXT_PUBLIC_APP_VERSION` env var is injected from `package.json` at build time via `next.config.ts`. To run the Firebase CLI locally, copy `.firebaserc.example` → `.firebaserc` and set your project ID (`.firebaserc` is gitignored; CI deploys with `--project`).

### Deployment

Pushing to **`main`** triggers the full deploy workflow: lint + typecheck → static build → Firebase Functions → Hosting → Firestore rules → Storage rules. Pushing to **`development`** runs lint + typecheck only. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
