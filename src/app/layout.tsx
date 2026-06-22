import type { Metadata } from "next";
import { Roboto, Roboto_Serif, Martian_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/context/auth-provider";
import { Toaster } from "@/components/ui/sonner";
import { ServiceWorkerCleanup } from "@/components/service-worker-cleanup";

const fontSans = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

const fontSerif = Roboto_Serif({
  subsets: ["latin"],
  variable: "--font-roboto-serif",
  display: "swap",
});

const fontMono = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian-mono",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Expense Tracker";
const SITE_DESCRIPTION =
  "A free expense tracker to manage income, expenses, wallets, recurring transactions, and analytics. Works offline in your browser — sign in to save your data and sync across devices.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s · ${SITE_NAME}`,
    default: `${SITE_NAME} — Track Income, Expenses & Wallets`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Jan Bautista" }],
  creator: "Jan Bautista",
  manifest: "/site.webmanifest",
  keywords: [
    "expense tracker",
    "budget tracker",
    "income tracker",
    "wallet manager",
    "personal finance",
    "recurring transactions",
    "offline finance app",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Track Income, Expenses & Wallets`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Expense Tracker — Track Income, Expenses & Wallets",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${SITE_NAME} — Track Income, Expenses & Wallets`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}
      >
        <ServiceWorkerCleanup />
        <NextTopLoader
          color="var(--primary)"
          height={3}
          shadow="0 0 10px var(--primary), 0 0 5px var(--primary)"
          showSpinner={false}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
