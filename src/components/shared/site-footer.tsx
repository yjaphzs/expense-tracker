import Link from "next/link";

import KofiButton from "@/components/dom/KofiButton";
import { APP_NAME, APP_VERSION } from "@/config/app";

/** The tracker's footer: Ko-fi, legal links, and the app version (as in the GWA Calculator). */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-4">
        <KofiButton username="yjaphzs" label="Buy Me a Ko-fi" preset="no_background" />
        <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <Link href="/terms-and-conditions" className="transition-colors hover:text-primary">
            Terms and Conditions
          </Link>
          <span aria-hidden className="text-border">
            •
          </span>
          <Link href="/privacy-policy" className="transition-colors hover:text-primary">
            Privacy Policy
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> {APP_NAME}{" "}
          <span className="font-mono">v{APP_VERSION}</span> · Made by{" "}
          <a
            href="https://www.yjaphzs.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium transition-colors hover:text-primary"
          >
            JPB
          </a>
        </p>
      </div>
    </footer>
  );
}
