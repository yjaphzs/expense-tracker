import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { AuthGuard } from "@/components/auth-guard";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { AppearanceButton } from "@/components/appearance/appearance-button";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-5 p-4 md:p-8">
        <header className="flex items-center justify-between">
          <BrandLogo />
          <AppearanceButton />
        </header>
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
          <Link href="/">
            <ArrowLeftIcon />
            Back to app
          </Link>
        </Button>
        {children}
      </div>
    </AuthGuard>
  );
}
