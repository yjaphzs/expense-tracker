import type { Metadata } from "next";
import Link from "next/link";
import { CompassIcon } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

/** Exported as 404.html, which Firebase Hosting serves for unknown URLs. */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <BrandLogo />
      <CompassIcon className="size-10 text-primary" aria-hidden />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          This page doesn&apos;t exist or has moved. Your data is safe.
        </p>
      </div>
      <Button asChild className="max-md:h-11">
        <Link href="/">Back to Expense Tracker</Link>
      </Button>
    </main>
  );
}
