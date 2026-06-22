![Github_Banner - Repository](https://github.com/user-attachments/assets/df431284-050f-4130-bc56-7cd573d2480c)

# Expense Tracker

A personal finance tracker for income and expenses across multiple wallets — with categories, recurring transactions, analytics, and Excel export. Built with **Next.js** (App Router), **Firebase**, and styled using **shadcn/ui** components.

The tracker is fully usable **without an account** (data is kept in your browser). Sign in to **save your data and sync it across devices**.

![Next.js](https://img.shields.io/badge/Made%20with-Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Made%20with-Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/Made%20with-TailwindCSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/Made%20with-shadcn/ui-111827?style=flat)

**Live Demo:**  
[https://expense-tracker.yjaphzs.xyz](https://expense-tracker.yjaphzs.xyz)

## Features

- Track income and expenses with categories, wallets, and descriptions
- Edit and delete transactions with confirmation dialogs
- Multiple wallets (Cash, E-Wallet/Card) with per-wallet balance tracking
- Wallet-to-wallet fund transfers
- Recurring transactions (daily, weekly, biweekly, monthly) with auto-processing, pause, and resume
- Analytics with sub-tabs (Overall, Income, Expense), category rankings, and interactive charts
- Styled Excel export with date-range presets
- QR code transfer between devices, plus JSON import/export with full validation
- Responsive design with dark mode support
- **Guest mode** — autosave to local storage, no account required
- **Optional accounts** — email/password + Google sign-in, password reset, email verification, profile photo, and live cross-device sync via Firestore
- In-app **"What's new"** changelog, Terms & Conditions, and Privacy Policy

## Tech stack

- **Next.js** App Router, exported as a static site (`output: 'export'`)
- **Firebase**: Hosting, Authentication, Firestore, Storage, and Cloud Functions
  (`deleteAccount`, `sendVerificationEmail`, `sendPasswordResetEmail`)
- **Tailwind CSS v4** + **shadcn/ui**, Recharts (analytics), xlsx-js-style (export)

## Getting Started

1. **Clone and install:**
   ```bash
   git clone https://github.com/yjaphzs/expense-tracker.git
   cd expense-tracker
   npm install
   ```

2. **Create a Firebase project** and a Web App in the [Firebase Console](https://console.firebase.google.com/), then enable:
   - **Authentication** → Sign-in methods: **Email/Password** and **Google**
   - **Firestore Database**
   - **Storage**
   - (optional) **App Check** with reCAPTCHA v3

3. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   # fill in the NEXT_PUBLIC_FIREBASE_* values from your Web App config
   ```

4. **Configure the email sender (Cloud Functions + Resend).** Auth emails
   (verification + password reset) are sent as branded HTML by Cloud Functions
   via [Resend](https://resend.com/docs/send-with-nodejs) — the functions
   generate the action link and rewrite it to the in-app `/auth/action` handler,
   so you don't need to customize the Firebase console action URL. Setup:
   add your domain in Resend, add the DKIM/SPF records it shows you, then create
   an API key. For local emulator testing:
   ```bash
   cp functions/.env.example functions/.env
   # fill in RESEND_API_KEY, EMAIL_FROM_EMAIL (e.g. no-reply@yjaphzs.xyz), APP_URL
   ```
   The email HTML is built from the `.hbs` sources in
   `functions/src/lib/email/templates/` via `npm run generate:emails` (mailwind
   inlines the styles into the committed `generated-templates.ts`).

5. **Run the dev server:**
   ```bash
   npm run dev
   ```

6. **Build the static export (production):**
   ```bash
   npm run build   # outputs ./out
   ```

## Local Firebase emulators (optional)

```bash
npm install -g firebase-tools
firebase emulators:start   # Auth, Firestore, Storage, Functions, Hosting
```

## Deployment

Pushing to **`main`** triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which
lint + typechecks, builds the static export, and deploys **Functions → Hosting → Firestore rules →
Storage rules** to the single Firebase project. Pushes to `development` run lint + typecheck only.

Required GitHub repository configuration:

- **Variables** (`Settings → Secrets and variables → Actions → Variables`): every `NEXT_PUBLIC_*`
  value (app + Firebase). `NEXT_PUBLIC_FIREBASE_PROJECT_ID` also selects the deploy target.
  For email: `EMAIL_FROM_NAME`, `EMAIL_FROM_EMAIL`.
- **Secrets** (`… → Secrets`): `GOOGLE_APPLICATION_CREDENTIALS_BASE64` (a base64-encoded Firebase
  service-account JSON key with deploy permissions), plus `RESEND_API_KEY` for the email sender.
  The workflow writes these into `functions/.env` at deploy time.

Set the custom domain (`expense-tracker.yjaphzs.xyz`) under Firebase Hosting → Custom domains.

## References

- **Ko-fi Button:**  
  [CostasAK/react-kofi-button](https://github.com/CostasAK/react-kofi-button)

- **UI Components, Charts & Hooks:**  
  [shadcn/ui](https://ui.shadcn.com/), [Recharts](https://recharts.org/)

- **Excel Export:**  
  [xlsx-js-style](https://github.com/gitbrent/xlsx-js-style)

- **QR Transfer:**  
  [qrcode.react](https://github.com/zpao/qrcode.react), [html5-qrcode](https://github.com/mebjas/html5-qrcode), [lz-string](https://github.com/pieroxy/lz-string)

## Screenshots

<img width="2560" height="1285" alt="screencapture-localhost-5173-expense-tracker-2026-03-09-06_35_56" src="https://github.com/user-attachments/assets/c0dd85f1-8346-485b-8e05-d1d00c062bd6" />

<img width="2560" height="2297" alt="screencapture-localhost-5173-expense-tracker-2026-03-09-06_35_00" src="https://github.com/user-attachments/assets/7b3fdca1-1fb5-41af-9a6b-04a4ad3be5d6" />

<img width="2560" height="1285" alt="screencapture-localhost-5173-expense-tracker-2026-03-09-06_35_27" src="https://github.com/user-attachments/assets/b96b91f7-fc5e-4c0c-8245-a8386408aca3" />

<img width="2560" height="1285" alt="screencapture-localhost-5173-expense-tracker-2026-03-09-06_35_16" src="https://github.com/user-attachments/assets/3fa1309a-1ac0-4cbd-b44a-8db1ceba3681" />

## MIT License

Made with ❤️ using Next.js and shadcn/ui.
