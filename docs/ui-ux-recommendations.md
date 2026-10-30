# UI/UX recommendations

An audit of the Expense Tracker after the 2.1.0 phone redesign. Items are ordered by
priority: **P1** fixes a real pain point or a risk, **P2** is a clear improvement, and
**P3** is polish or a longer-term bet. Effort is a rough guess: S (hours), M (a day or
two), L (several days).

## Shipped in 2.1.0

These came out of the same audit and are done:

- Phone shell: a bottom tab bar, a floating Add button per section, and `?tab=` so a
  refresh keeps the section.
- Forms, menus, and pickers open as bottom sheets on phones; confirmations stay dialogs.
- Tapping a transaction or recurring row opens its actions; deleting a transaction has Undo.
- Transfers are deleted and restored as a pair (`transferId`), and transfer legs can no
  longer be edited one at a time.
- Peso formatting (`₱`), a decimal keypad for amounts, success toasts, and an error toast
  when a cloud save fails.
- Labels linked to inputs, `aria-label`s on icon buttons, `aria-pressed` on the type toggles,
  and 40px touch targets on phones.
- Analytics fits a phone: a view picker instead of five tabs, compact axis labels, and
  full-width filters.

## P1

| Item | Why | Effort |
|---|---|---|
| **Search and filters** on the transaction lists (text, category, wallet, date range) | Past a few weeks of data, the only way to find a transaction is paging through it. | M |
| **Edit a transfer as a pair** (open the transfer form, update both legs) | Today a transfer can only be deleted and re-created. | S |
| **Remember the last-used wallet and category** in the Add form | Most entries repeat the same wallet; the form always starts on the first wallet and an empty category. | S |
| **Budgets with progress** (monthly limit per category, warning at 80% and 100%) | The app records spending but doesn't help plan it. | M |
| **Split the tracker document** before it reaches Firestore's 1 MiB limit | Everything lives in `users/{uid}/tracker/state`. At roughly 250 bytes a transaction, that's about 4,000 transactions (2 years of daily use), after which saves fail. Start with a size warning, then move transactions into monthly docs or a subcollection. | L |

## P2

| Item | Why | Effort |
|---|---|---|
| **Custom categories** (add, rename, pick an icon) | The fixed lists don't fit everyone, so a lot ends up in "Other". | M |
| **Rename and reorder wallets** | A wallet can only be added or deleted, and only when it has no transactions. | S |
| **Recurring end dates and an "upcoming" list** | Subscriptions and installments end, and there's no view of what's due this week. | M |
| **CSV export and import** | JSON is only useful for backups; CSV opens in any spreadsheet and lets people bring data from bank exports. | M |
| **First-run onboarding** (suggest Cash and an e-wallet, then the first transaction) | A new user lands on an empty state that asks for a wallet before anything else. | S |
| **Sync status in the account menu** (saving, saved, offline, failed) | The menu now says "Cloud sync on"; a real status would answer "did that save?" | M |
| **Tests and a size limit** (Vitest for `use-transactions`, `transferPartner`, merge logic; an ESLint `max-lines` rule) | The app has no tests, and large files make changes risky. | M |
| **Break up `analytics.tsx`** (about 970 lines) and `page.tsx` (about 720) | One file per chart or section, like the GWA Calculator's 200-line rule. | M |

## P3

| Item | Why | Effort |
|---|---|---|
| **PWA install prompt** (a dismissible "Add to Home screen" banner on the second visit) | The app already works offline; installing it makes it feel like one. | S |
| **Custom 404 and error pages** | Unknown URLs and crashes show the framework defaults. | S |
| **A short landing section for signed-out first visits** | Search visitors see an empty tracker with no explanation of what it does. | M |
| **Compact header on narrow phones** | The brand name truncates ("Expense Trac…") next to the What's new, theme, and sign-in buttons; show the logo alone below `sm`. | S |
| **Multi-currency** (per wallet, with a display currency) | Useful for travel and remote work, but it touches every total and chart. | L |
