"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Shown when something on a page crashes; the rest of the app keeps working. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <TriangleAlertIcon className="size-10 text-destructive" aria-hidden />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          The page hit an unexpected error. Your saved data is safe. Try again, or go back home.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button className="max-md:h-11" onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" asChild className="max-md:h-11">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}
