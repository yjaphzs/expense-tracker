"use client";

import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { ChangePasswordCard } from "@/app/account/_components/change-password-card";
import { DeleteAccountCard } from "@/app/account/_components/delete-account-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/auth-provider";
import { hasPasswordProvider, signOut } from "@/lib/firebase/auth";

/** Account security: password (when the account has one), sign out, and delete. */
export function SecurityTab() {
  const { user } = useAuth();
  const router = useRouter();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Hidden for Google-only accounts (no password). */}
      {hasPasswordProvider(user) && <ChangePasswordCard user={user} />}

      <Card>
        <CardHeader>
          <CardTitle>Sign out</CardTitle>
          <CardDescription>Sign out on this device. Your saved data stays in your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={async () => {
              await signOut();
              router.replace("/");
            }}
          >
            <LogOutIcon />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountCard user={user} />
    </div>
  );
}
