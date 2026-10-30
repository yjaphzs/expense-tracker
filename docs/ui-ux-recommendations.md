# UI/UX recommendations

An audit of the Expense Tracker after the 2.1.0 phone redesign, updated after 2.2.0. Items are
ordered by priority: **P1** fixes a real pain point or a risk, **P2** is a clear improvement, and
**P3** is polish or a longer-term bet. Effort is a rough guess: S (hours), M (a day or two), L
(several days).

## Shipped

### 2.2.0

- **Search and filters** on Home, Income and Expenses (text, category, wallet, date presets).
- **Transfers edited as a pair**, with a date field.
- **Remembered wallet and category** in the Add forms (per device).
- **Monthly budgets**, overall and per category, with a Home card and warnings at 80% and 100%.
- **Custom categories** with icons; renaming updates every transaction, recurring item and budget.
- **Wallet editing and reordering.**
- **Recurring end dates** and a "Coming up in the next 7 days" card.
- **CSV export and import** (preview, append, Undo).
- **First-run onboarding** with one-tap wallets.
- **Sync status** in the account menu, plus a storage-size warning.
- **Tests and a 200-line file limit** (Vitest, ESLint `max-lines`); `page.tsx`, `analytics.tsx` and
  the persistence hook are split up.
- **Install banner**, **404 and error pages**, and a **compact header** on narrow phones.
- **Exports:** the Excel workbook restyled like the GWA Calculator's reports, and a printable
  Summary Report.

### 2.1.0

- Phone shell: bottom tab bar, floating Add button per section, `?tab=` in the URL.
- Bottom sheets for forms, menus and pickers; confirmations stay dialogs.
- Tap-a-row actions; delete with Undo; transfers deleted and restored as a pair.
- Peso formatting, decimal keypad, success toasts, failed-save toast, accessibility fixes.

## Still open

| Priority | Item | Why | Effort |
|---|---|---|---|
| P1 | **Split the tracker document** before it reaches Firestore's 1 MiB limit | Everything lives in `users/{uid}/tracker/state`. At roughly 250 bytes a transaction, that's about 4,000 transactions. 2.2.0 warns at about 800 KB; the fix is monthly docs or a subcollection, with a migration. | L |
| P2 | **Budget history** | Budgets only compare the current month; a month-by-month view would show trends. | M |
| P2 | **Drag to reorder wallets** | Wallets move one step at a time from the ⋯ menu today. | S |
| P3 | **A short landing section for signed-out first visits** | Search visitors see the tracker with no explanation of what it does beyond the onboarding card. | M |
| P3 | **Multi-currency** (per wallet, with a display currency) | Useful for travel and remote work, but it touches every total, chart and export. | L |
