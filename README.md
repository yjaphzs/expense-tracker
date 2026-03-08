# Expense Tracker

A personal finance tracker built with React, TypeScript, and Vite. Track your income and expenses across multiple wallets — all data is stored locally in your browser.

## Features

### Transactions

- **Track Income & Expenses** — Record transactions with a date, category, amount, description, and wallet.
- **Edit Transactions** — Modify any existing transaction's details.
- **Delete Transactions** — Remove any transaction with a confirmation dialog.
- **Transaction History** — Grouped by date (newest first) with color-coded income (green) and expense (red) indicators, category badges, and wallet info.
- **Filtered Tabs** — Dedicated Income and Expenses tabs show only the relevant transaction type.

**Expense categories:** Food, Travel, Bills, Shopping, Entertainment, Health, Education, Other
**Income categories:** Salary, Allowance, Freelance, Investment, Gift, Other

### Wallets

- **Multiple Wallets** — Create Cash or E-Wallet/Card type wallets with custom names.
- **Per-Wallet Balances** — Each wallet card shows its current balance, total income, and total expenses.
- **Balance Summary** — See your overall balance, income, and expenses at a glance with a positive/negative status badge and copy-to-clipboard button.
- **Manage Wallets** — Add new wallets or remove unused ones (only wallets with no transactions can be deleted).

### Recurring Transactions

- **Automated Scheduling** — Set up income or expenses that repeat daily, weekly, biweekly, or monthly.
- **Auto-Processing** — Due transactions are automatically created when the app loads, with a backfill limit of 90 per item.
- **Pause & Resume** — Enable or disable individual recurring transactions at any time.
- **Delete Recurring** — Remove a recurring rule; previously created transactions are kept.

### Analytics

- **Monthly Income vs. Expense** — Bar chart comparing income and expenses side-by-side per month.
- **Category Breakdown** — Donut chart with a toggle between income and expense categories, showing amounts and percentages.
- **Cumulative Cash Flow** — Area chart showing your running net balance over time.
- **Wallet Comparison** — Horizontal bar chart comparing balances across wallets (shown when 2+ wallets exist).
- **Period Filter** — View analytics for the last 3, 6, or 12 months, or all time.

### Excel Export

- **Themed Spreadsheets** — Exports a styled `.xlsx` file with the app's golden-amber accent, green income highlights, and red expense highlights.
- **Three Sheets:**
  - **Transactions** — Every transaction with date, type, category, description, amount, and wallet. Rows are tinted green/red by type.
  - **Summary** — Total income, total expenses, net balance, and a full category breakdown.
  - **Monthly Breakdown** — Per-month totals for income, expenses, and net, with color-coded values.
- **Date Range Presets** — This Month, Last Month, Last 3/6 Months, This Year, Last Year, or All Time.

### Data Management

- **Autosave** — Enabled by default; automatically persists all data to localStorage.
- **Manual Save** — Explicitly save data to localStorage.
- **JSON Export** — Download all data (transactions, recurring, wallets, preferences) as a `.json` file.
- **JSON Import** — Restore data from a previously exported file with full format validation.
- **Reset** — Wipe all transactions, recurring rules, and wallets with a confirmation dialog.

### UI & Appearance

- **Dark Mode** — Toggle between light and dark themes, persisted across sessions.
- **Toast Notifications** — Rich feedback for all actions (save, import, export, errors) via Sonner.
- **Responsive Design** — Mobile-first layout with adaptive wallet card grids.
- **PWA Ready** — Installable as a Progressive Web App for offline use.

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for bundling and dev server
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) (New York style) for UI components
- [Radix UI](https://www.radix-ui.com/) primitives
- [Recharts](https://recharts.org/) for analytics charts
- [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style) for styled Excel exports
- [Lucide React](https://lucide.dev/) for icons
- [Sonner](https://sonner.emilkowal.dev/) for toast notifications
- [Framer Motion](https://www.framer.com/motion/) for animations

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm or pnpm

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
  App.tsx                          # Main app layout, tabs, and data management
  main.tsx                         # Entry point
  index.css                        # Global styles and CSS variables
  types/
    transaction.ts                 # Transaction, Wallet & Recurring types, category constants
  hooks/
    use-transactions.ts            # Transaction CRUD + summary (localStorage)
    use-wallets.ts                 # Wallet CRUD + per-wallet balances (localStorage)
    use-recurring-transactions.ts  # Recurring transaction CRUD + auto-processing
    use-local-storage.ts           # Generic localStorage hook
    use-appearance.tsx             # Theme (light/dark) hook
  components/
    smart/
      add-transaction-dialog.tsx   # Form dialog to add/edit income, expense, or recurring
      add-recurring-dialog.tsx     # Recurring transaction setup within the dialog
      transaction-list.tsx         # Grouped transaction list with edit & delete
      balance-summary.tsx          # Total balance, income, expenses display
      wallet-cards.tsx             # Wallet grid + manage/add wallets dialogs
      recurring-list.tsx           # Recurring transaction list with pause/delete
      analytics.tsx                # Charts (bar, pie, area) and period filter
      excel-export.tsx             # Styled Excel export with date range selection
      data-toolbar.tsx             # Save, import, export, autosave, reset controls
    ui/                            # shadcn/ui primitives (button, dialog, tabs, etc.)
    dom/                           # App-specific DOM components (header, Ko-fi button)
  lib/
    utils.ts                       # cn() helper, formatCurrency()
    category-icons.ts              # Map of category names to Lucide icons
```

## License

Private project.
