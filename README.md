# Expense Tracker

A personal finance tracker built with React, TypeScript, and Vite. Track your income and expenses across multiple wallets — all data is stored locally in your browser.

## Features

- **Track Income & Expenses** — Record transactions with categories like Food, Travel, Bills, Salary, Allowance, and more.
- **Multiple Wallets** — Track separate balances for Cash, E-Wallet, Cards, Bank accounts, or any custom wallet you create.
- **Balance Summary** — See your total balance, income, and expenses at a glance.
- **Per-Wallet Balances** — View the balance of each individual wallet on the Home tab.
- **Manage Wallets** — Add new wallets with custom names and icons, or remove unused ones.
- **Transaction History** — Grouped by date with color-coded income (green) and expense (red) indicators.
- **Filter by Type** — Dedicated tabs for viewing only Income or only Expenses.
- **Delete Transactions** — Remove any transaction with a confirmation dialog.
- **Dark Mode** — Toggle between light and dark themes.
- **Local Storage** — All data persists in your browser across sessions. No backend required.
- **PWA Ready** — Installable as a Progressive Web App.

## Tech Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) for bundling and dev server
- [Tailwind CSS v4](https://tailwindcss.com/) for styling
- [shadcn/ui](https://ui.shadcn.com/) (New York style) for UI components
- [Radix UI](https://www.radix-ui.com/) primitives
- [Lucide React](https://lucide.dev/) for icons

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
  App.tsx                         # Main app layout and routing
  main.tsx                        # Entry point
  index.css                       # Global styles and CSS variables
  types/
    transaction.ts                # Transaction & Wallet types, category constants
  hooks/
    use-transactions.ts           # Transaction CRUD + summary (localStorage)
    use-wallets.ts                # Wallet CRUD + per-wallet balances (localStorage)
    use-local-storage.ts          # Generic localStorage hook
    use-appearance.tsx            # Theme (light/dark) hook
  components/
    smart/
      add-transaction-dialog.tsx  # Form dialog to add income/expense
      transaction-list.tsx        # Grouped transaction list with delete
      balance-summary.tsx         # Total balance, income, expenses display
      wallet-cards.tsx            # Wallet grid + manage/add wallets dialogs
    ui/                           # shadcn/ui primitives (button, dialog, tabs, etc.)
    dom/                          # App-specific DOM components (header, Ko-fi button)
  lib/
    utils.ts                      # cn() helper, formatCurrency()
```

## License

Private project.
