"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  applyActionCode,
  verifyPasswordResetCode,
} from "firebase/auth";
import {
  ArrowLeftIcon,
  CircleCheckIcon,
  MailCheckIcon,
  TriangleAlertIcon,
} from "lucide-react";

import { auth } from "@/lib/firebase/client";
import { getAuthErrorMessage } from "@/lib/firebase/errors";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ResetPasswordForm } from "./reset-password-form";

type Phase = "loading" | "reset" | "verified" | "done" | "invalid";

function CenteredCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="p-2">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 w-fit rounded-full bg-primary/10 p-3">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}

export function ActionHandler() {
  const params = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  const [phase, setPhase] = useState<Phase>("loading");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!oobCode || !mode) {
      setPhase("invalid");
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        if (mode === "resetPassword") {
          const verifiedEmail = await verifyPasswordResetCode(auth, oobCode!);
          if (cancelled) return;
          setEmail(verifiedEmail);
          setPhase("reset");
        } else if (mode === "verifyEmail") {
          await applyActionCode(auth, oobCode!);
          if (cancelled) return;
          setPhase("verified");
        } else {
          setPhase("invalid");
        }
      } catch (err) {
        if (cancelled) return;
        setError(getAuthErrorMessage(err));
        setPhase("invalid");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [mode, oobCode]);

  if (phase === "loading") {
    return (
      <div className="flex flex-col items-center gap-3 py-10">
        <Spinner className="size-6 text-primary" />
        <p className="text-sm text-muted-foreground">Verifying your link…</p>
      </div>
    );
  }

  if (phase === "invalid") {
    return (
      <CenteredCard
        icon={<TriangleAlertIcon className="size-6 text-primary" />}
        title="Link not valid"
        description={
          error ?? "This link is invalid or has already been used. Request a new one and try again."
        }
      >
        <Button asChild className="w-full" variant="outline">
          <Link href="/login">
            <ArrowLeftIcon />
            Back to login
          </Link>
        </Button>
      </CenteredCard>
    );
  }

  if (phase === "verified") {
    return (
      <CenteredCard
        icon={<MailCheckIcon className="size-6 text-primary" />}
        title="Email verified"
        description="Thanks! Your email address has been confirmed."
      >
        <Button asChild className="w-full">
          <Link href="/account">Go to your account</Link>
        </Button>
      </CenteredCard>
    );
  }

  if (phase === "done") {
    return (
      <CenteredCard
        icon={<CircleCheckIcon className="size-6 text-primary" />}
        title="Password updated"
        description="Your password has been changed. You can now sign in with it."
      >
        <Button asChild className="w-full">
          <Link href="/login">Continue to login</Link>
        </Button>
      </CenteredCard>
    );
  }

  // phase === "reset"
  return (
    <ResetPasswordForm
      email={email}
      oobCode={oobCode!}
      onDone={() => setPhase("done")}
    />
  );
}
