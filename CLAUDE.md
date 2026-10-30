# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend (root)**
```bash
npm run dev          # Dev server (no static export, hot reload). Webpack, like the build: the Serwist plugin adds a webpack config, which Turbopack (Next 16's default) refuses
npm run build        # Production static export → ./out
npm run lint         # ESLint (includes the 200-line rule)
npm run typecheck    # TypeScript type check (no emit)
npm test             # Vitest unit tests (pure logic); npm run test:watch to iterate
```

Before committing, run `npm run lint`, `npm run typecheck`, and `npm test`. CI runs all three.

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

## Hard rules

- **Size and focus:** at most **200 lines of code per file** under `src/` (blank lines and comments excluded), one responsibility per file. ESLint `max-lines` enforces it as an **error**. Exempt: `src/components/ui/**`, the vendored `hooks/use-local-storage.ts`, the legal `page.tsx` files, and tests. When a file grows, split it: pure logic to `src/lib/*` (with a test), state to a hook, markup to smaller components.
- **Dates:** tracker dates are local calendar days (`"YYYY-MM-DD"`). Never derive them with `toISOString()` (that's UTC; most users are UTC+8). Use `toLocalDateStr`, `todayStr`, `addDays` and `addInterval` from [`src/lib/recurring-schedule.ts`](src/lib/recurring-schedule.ts). Tests run with `TZ=Asia/Manila`.
- **Copy:** no em dashes ("—") in new user-facing text. En dashes only in number ranges.
- **Tests** sit next to their module as `*.test.ts` and cover pure logic only (no DOM, no Firebase).

## Architecture

### Frontend (Next.js App Router + static export)

The app is **entirely client-rendered** and deployed as a static export (`output: 'export'` in production only; `npm run dev` runs a normal Next.js server). All data fetching and Firebase interaction happens in the browser.

**Route layout:**
- `/`: the tracker (public, no auth required). `src/app/page.tsx` only wraps `TrackerPage` in `TrackerProvider`.
- `/(auth)/login`, `/register`, `/forgot-password`: guest-only pages (redirect signed-in users away)
- `/account`: auth-only profile management
- `/auth/action`: handles Firebase email action links (verify email, reset password)
- `/(legal)/privacy-policy`, `/terms-and-conditions`: static legal pages
- `not-found.tsx` (exported as `404.html`, which Firebase Hosting serves for unknown URLs) and `error.tsx`

Route guards live in [`src/components/auth-guard.tsx`](src/components/auth-guard.tsx) and [`src/components/guest-guard.tsx`](src/components/guest-guard.tsx). Route name constants are in [`src/config/routes.ts`](src/config/routes.ts).

### The tracker page

[`src/context/tracker-context.tsx`](src/context/tracker-context.tsx) builds one object for the page and its sections, read with `useTracker()`:
- `data`: `useTrackerData()` = `useExpenseData()` plus the logic hooks (`use-transactions`, `use-recurring-transactions`, `use-wallets`), and the once-per-load processing of due recurring items.
- `dialogs`: `useTrackerDialogs()`, which overlay is open and what it's editing.
- `actions`: `use-entry-actions` (transactions, transfers, recurring; budget warnings), `use-data-actions` (save, JSON backup, QR, CSV import, reset), `use-setup-actions` (wallets, categories, budgets). Actions own the toasts.
- `section` / `setSection`: the current section, mirrored to `?tab=`.

`useCategoryIcon()` (same file) and `components/smart/category-icon.tsx` look up icons for built-in and custom categories.

Layout: `components/smart/tracker-page.tsx` (header, tabs, phone nav, footer), `sections/` (home, transactions for Income/Expenses, recurring, analytics), `tracker-dialogs.tsx` (every overlay), `form/` (shared form parts: selects, type toggle, ends field, `use-transaction-form`), `filters/`, `budgets/`, `categories/`, `onboarding/`, `qr/`, `analytics/` (one file per chart), `export/`.

### Data persistence (the core design)

[`src/hooks/use-expense-data.ts`](src/hooks/use-expense-data.ts) presents a **single unified API** (`transactions`, `setTransactions`, `budgets`, `setBudgets`, …) whether or not the user is signed in. It's a facade over:
- **Guest:** `use-guest-tracker-store.ts`, localStorage (keys in [`src/lib/guest-storage.ts`](src/lib/guest-storage.ts)). With autosave off, edits stay in memory until Save. Functional updates apply to the latest in-memory state, so back-to-back edits can't overwrite each other.
- **Signed in:** `use-cloud-tracker-store.ts`, a live Firestore subscription to `users/{uid}/tracker/state`, and `use-cloud-writer.ts`, debounced writes (600 ms). A pending write is **flushed, not dropped**, when the page is hidden, closed, or the user signs out.

On first sign-in, if both local and cloud have data, the facade surfaces a `pendingMerge` resolved by [`MergeDialog`](src/components/smart/merge-dialog.tsx) (keep local, keep cloud, or merge). A per-account flag (`expense_tracker_reconciled_{uid}`) prevents the prompt from showing again on the same device.

**State fields:** `TrackerState` ([`src/types/index.ts`](src/types/index.ts)) holds `transactions`, `recurring`, `wallets`, `budgets`, `categories` and `autosave`. The pure helpers in [`src/lib/tracker-state.ts`](src/lib/tracker-state.ts) (`normalizeState`, `hasData`, `sameState`, `mergeStates`) are driven by `TRACKER_ARRAY_FIELDS`. **Adding an array field** = add it to that list, the type, `GUEST_KEYS`, `import-validation.ts` (optional, so old backups still import), and the Firestore index overrides. Budgets and categories are optional in backups and QR payloads from before 2.2.0. Firestore rejects `undefined`, so optional keys (`endDate`, `Budget.category`) are left out when unset.

**Sync status:** `use-cloud-writer` reports saving / saved / offline / error to a small store ([`src/lib/sync-status.ts`](src/lib/sync-status.ts)) that the account menu reads. It also warns once the saved state passes about 800 KB (the doc limit is 1 MiB).

**Transfers** are two transactions (an expense leg and an income leg) sharing a `transferId` ([`src/lib/transfers.ts`](src/lib/transfers.ts)). `transferPartner()` in [`src/types/transaction.ts`](src/types/transaction.ts) finds the other leg (older transfers without `transferId` are paired by date, amount, and wallets). Editing, deleting and Undo act on both legs.

### Auth state

[`src/context/auth-provider.tsx`](src/context/auth-provider.tsx) exports `AuthProvider` and `useAuth()`. It exposes `{ user, profile, loading }`:
- `user`: Firebase Auth user object
- `profile`: live snapshot of `users/{uid}` Firestore doc (`UserProfile` type)
- `loading`: true while the initial auth state resolves

### Firebase client SDK (`src/lib/firebase/`)

All Firebase service access goes through wrappers in this directory; never import from `firebase/*` directly in components:
- `client.ts`: initializes the Firebase app (singleton). **App Check starts on demand** (`ensureAppCheck`): on the auth pages (`AppCheckActivator`), once a user signs in, and at load **before `getAuth()`** when the browser had a signed-in session (the `expense_tracker_session_hint` flag `AuthProvider` keeps). That early start is required: with App Check enforced, Auth's session re-check on load fails without a token and signs the user out. Guests never load reCAPTCHA (free tier: 10,000 assessments a month), so don't start it at import time.
- `email-delivery.ts`: `deliverVerificationEmail()` / `deliverPasswordReset()`. Use these, not the raw callables: they fall back to Firebase Auth's built-in emails when the Resend quota is used up.
- `auth.ts`: auth helpers (`signIn`, `signOut`, `onAuthChange`, etc.)
- `firestore.ts`: Firestore helpers including `subscribeTrackerState`, `writeTrackerState`, `ensureUserProfile`
- `storage.ts`: Storage upload/download helpers
- `callable.ts`: typed wrappers for the three Cloud Functions
- `index.ts`: re-exports the public API

### Firestore schema

```
users/{uid}                    # UserProfile doc
users/{uid}/tracker/state      # TrackerState doc (transactions, recurring, wallets, budgets, categories, autosave)
rateLimits/{bucketId}          # Server-only; clients denied by rules. TTL on expireAt
```

`firestore.indexes.json` exempts the tracker arrays from indexing (nothing queries them) and sets the `rateLimits.expireAt` TTL. `storage.rules` only allows an owner's `users/{uid}/avatar` image, up to 1 MB.

### Cloud Functions (`functions/src/`)

Three callable HTTPS functions, all deployed to `asia-southeast1` (co-located with Firestore):
- `deleteAccount`: atomically deletes Auth user + Firestore + Storage data
- `sendVerificationEmail`: generates a Firebase action link and sends branded HTML via Resend
- `sendPasswordResetEmail`: same pattern

**Email quota fallback** ([`functions/src/lib/email/quota.ts`](functions/src/lib/email/quota.ts)): Resend's free plan allows 100 emails a day. Each send first claims a slot from a global daily budget (90, so spoofed IPs can't drain it) and checks whether Resend recently refused for quota reasons (`rateLimits/email_quota`). Either case tells the client to send Firebase's built-in email instead (`unavailable` with `details.fallback === "firebase"` for verification, `{ fallback: true }` for reset).

Email HTML is pre-built from Handlebars templates in `functions/src/lib/email/templates/` using mailwind (Tailwind v3 inline styles). Run `npm run generate:emails` inside `functions/` to rebuild `generated-templates.ts` after changing `.hbs` files.

### Exports and the printable report

- **Shared:** [`src/lib/export/period.ts`](src/lib/export/period.ts) (period presets) and `aggregate.ts` / `breakdowns.ts` build one `ReportData` (totals, categories, wallet movement, budgets vs actual, weekly and monthly rows). Transfers never count as income or spending. Palette: `lib/export/theme.ts` (the GWA Calculator's report colors).
- **Excel:** `lib/export/xlsx/*` writes every sheet with the dark band, amber stripe, a "Prepared for / Generated" line, zebra tables, real date cells and the `"₱"#,##0.00` number format (Summary, Transactions, Weekly, Monthly, Monthly Detail). `xlsx-js-style` loads on first use and can't write frozen panes.
- **Printable Summary Report:** `lib/report/*` builds a self-contained HTML document (inline CSS and SVG, escaped input) and prints it through a hidden iframe (print or save as PDF). It's deliberately **not** called a "statement". Its disclaimer must stay consistent with the Terms ("not an official financial statement") and the Privacy Policy's export section; update those pages if the report's name or content changes.
- **CSV:** `lib/csv.ts` (RFC 4180) and `lib/csv-transactions.ts` (export, and import with a preview that appends).
- **UI:** the Analytics tab's "Export & print" panel (`components/smart/export/`). JSON backups and QR transfer carry every state field.

### UI components

- `src/components/ui/`: shadcn/ui primitives (auto-generated; edit with care)
- `src/components/smart/`: business components (see "The tracker page")
- `src/components/shared/`: generic building blocks (responsive dialog/menu, bottom tab bar, floating Add button, date picker field, site footer, install banner)
- `src/components/dom/`: third-party wrappers (Ko-fi button)

**Phones (below `md`; desktop is unchanged):**
- **Overlays:** tasks (forms, menus, pickers) open as bottom sheets via `shared/responsive-dialog.tsx` and `shared/responsive-menu.tsx` (vaul drawer on phones, Radix dialog/dropdown from `md` up). Form footers use `shared/form-dialog-actions.tsx` (primary first in a sheet). Confirmations stay `AlertDialog`s.
- **Shell:** `TrackerPage` hides the top tabs and shows `BottomTabBar` plus a section-specific `FloatingAddButton` (none on Analytics). The `viewport` export sets `viewportFit: "cover"` for the safe-area padding.
- **Toasts:** at the **top** on phones (`components/ui/sonner.tsx` switches with `useIsMobile`), clear of the tab bar, the floating button and sheets; bottom-right on desktop.
- **Rows:** tapping a transaction or recurring row opens its action sheet; the inline buttons are `md` and up only. Deleting a transaction is immediate with an Undo toast.
- **Touch targets:** icon buttons are 40px on phones (`max-md:size-10`).
- **Header and footer:** the header shows only the brand and actions; the app version is in `shared/site-footer.tsx`.

**Money:** `formatCurrency` shows pesos (`₱1,234.50`), `formatCompactCurrency` is for chart axes (`₱12.5K`), and `formatAmount` is the plain number the copy button copies. Amount inputs use `inputMode="decimal"`.

**Loading:** Analytics (recharts), the export panel (`xlsx-js-style`), and the QR dialog are loaded on first use. The service worker precaches only the `/` shell; other assets are cached as they're used (`pwa-register.tsx` hands the worker the files the page already loaded, so offline works after the first visit). It never reloads the page when the connection returns.

### Environment variables

Copy `.env.local.example` → `.env.local` for frontend Firebase config. Copy `functions/.env.example` → `functions/.env` for Resend + email config. The `NEXT_PUBLIC_APP_VERSION` env var is injected from `package.json` at build time via `next.config.ts`. To run the Firebase CLI locally, copy `.firebaserc.example` → `.firebaserc` and set your project ID (`.firebaserc` is gitignored; CI deploys with `--project`).

### Release

Bump `version` in `package.json` and add the matching entry at the top of [`src/config/changelog.ts`](src/config/changelog.ts) (it drives the in-app "What's new" dialog). User-facing wording, no em dashes.

### Deployment

Pushing to **`main`** triggers the full deploy workflow: lint + typecheck + tests → static build → Firebase Functions → Hosting → Firestore indexes → Firestore rules → Storage rules. Pushing to **`development`** runs lint, typecheck, and tests only. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
