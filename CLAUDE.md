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

### Auth state

[`src/context/auth-provider.tsx`](src/context/auth-provider.tsx) exports `AuthProvider` and `useAuth()`. It exposes `{ user, profile, loading }`:
- `user` — Firebase Auth user object
- `profile` — live snapshot of `users/{uid}` Firestore doc (`UserProfile` type)
- `loading` — true while the initial auth state resolves

### Firebase client SDK (`src/lib/firebase/`)

All Firebase service access goes through wrappers in this directory — never import from `firebase/*` directly in components:
- `client.ts` — initializes the Firebase app (singleton)
- `auth.ts` — auth helpers (`signIn`, `signOut`, `onAuthChange`, etc.)
- `firestore.ts` — Firestore helpers including `subscribeTrackerState`, `writeTrackerState`, `ensureUserProfile`
- `storage.ts` — Storage upload/download helpers
- `callable.ts` — typed wrappers for the three Cloud Functions
- `index.ts` — re-exports the public API

### Firestore schema

```
users/{uid}                    # UserProfile doc
users/{uid}/tracker/state      # TrackerState doc (transactions, wallets, recurring, autosave)
rateLimits/{bucketId}          # Server-only; clients denied by rules
```

`TrackerState` (defined in [`src/types/index.ts`](src/types/index.ts)) is a single Firestore document containing all three data arrays. The subcollection keeps the profile doc small and the subscription narrow.

### Cloud Functions (`functions/src/`)

Three callable HTTPS functions, all deployed to `asia-southeast1` (co-located with Firestore):
- `deleteAccount` — atomically deletes Auth user + Firestore + Storage data
- `sendVerificationEmail` — generates a Firebase action link and sends branded HTML via Resend
- `sendPasswordResetEmail` — same pattern

Email HTML is pre-built from Handlebars templates in `functions/src/lib/email/templates/` using mailwind (Tailwind v3 inline styles). Run `npm run generate:emails` inside `functions/` to rebuild `generated-templates.ts` after changing `.hbs` files.

### UI components

- `src/components/ui/` — shadcn/ui primitives (auto-generated; edit with care)
- `src/components/smart/` — business-logic components (dialogs, lists, analytics, export)
- `src/components/dom/` — third-party wrappers (Ko-fi button)

### Environment variables

Copy `.env.local.example` → `.env.local` for frontend Firebase config. Copy `functions/.env.example` → `functions/.env` for Resend + email config. The `NEXT_PUBLIC_APP_VERSION` env var is injected from `package.json` at build time via `next.config.ts`.

### Deployment

Pushing to **`main`** triggers the full deploy workflow: lint + typecheck → static build → Firebase Functions → Hosting → Firestore rules → Storage rules. Pushing to **`development`** runs lint + typecheck only. See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).
