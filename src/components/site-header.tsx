import { AccountMenu } from "@/components/account-menu";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { WhatsNewButton } from "@/components/whats-new";

/**
 * Sticky top app bar: brand on the left, and the What's-new / theme / account
 * controls grouped on the right. The version lives in the footer.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-2 px-4">
        <BrandLogo asHeading className="min-w-0" nameClassName="truncate text-base sm:text-xl" />
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <WhatsNewButton />
          <ThemeToggle />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
