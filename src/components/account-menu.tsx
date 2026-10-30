"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogInIcon,
  LogOutIcon,
  RefreshCwIcon,
  UserIcon,
} from "lucide-react";

import { useAuth } from "@/context/auth-provider";
import { signOut } from "@/lib/firebase/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ResponsiveMenu } from "@/components/shared/responsive-menu";
import type { MenuGroup } from "@/components/shared/menu-types";
import { SyncAttentionDot, SyncStatusLine } from "@/components/sync-status-line";
import { retrySync, useSyncStatus } from "@/lib/sync-status";

function initialsFrom(name: string | null, email: string | null): string {
  const source = (name ?? email ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

interface AccountSummaryProps {
  name: string | null;
  email: string | null;
  photo?: string;
  initials: string;
}

/** Name, email, and where the latest changes are; the avatar only shows in the phone sheet. */
function AccountSummary({ name, email, photo, initials }: AccountSummaryProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-10 md:hidden">
        {photo && <AvatarImage src={photo} alt="" />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-0.5">
        {name && <span className="truncate font-medium">{name}</span>}
        <span className="truncate text-xs text-muted-foreground">{email}</span>
        <SyncStatusLine />
      </div>
    </div>
  );
}

export function AccountMenu() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const sync = useSyncStatus();

  if (loading) {
    return <div className="size-8 animate-pulse rounded-full bg-muted" />;
  }

  if (!user) {
    return (
      <Button
        asChild
        size="sm"
        className="font-semibold shadow-sm transition-shadow hover:shadow-md"
      >
        <Link href="/login">
          {/* Icon from sm up: on phones the brand name needs the room. */}
          <LogInIcon className="size-4 max-sm:hidden" />
          Sign in
        </Link>
      </Button>
    );
  }

  const photo = profile?.photoURL ?? user.photoURL ?? undefined;
  const name = user.displayName ?? profile?.displayName ?? null;
  const initials = initialsFrom(name, user.email);

  const groups: MenuGroup[] = [
    ...(sync.state === "error"
      ? [{ id: "sync", items: [{ kind: "action" as const, id: "retry", label: "Try saving again", icon: RefreshCwIcon, onSelect: retrySync }] }]
      : []),
    {
      id: "pages",
      items: [{ kind: "link", id: "account", label: "Account", icon: UserIcon, href: "/account" }],
    },
    {
      id: "session",
      items: [
        {
          kind: "action",
          id: "logout",
          label: "Log out",
          icon: LogOutIcon,
          onSelect: () => void signOut().then(() => router.refresh()),
        },
      ],
    },
  ];

  return (
    <ResponsiveMenu
      title="Your account"
      groups={groups}
      header={<AccountSummary name={name} email={user.email} photo={photo} initials={initials} />}
      trigger={
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="Open account menu">
          <Avatar>
            {photo && <AvatarImage src={photo} alt="" />}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <SyncAttentionDot />
        </Button>
      }
    />
  );
}
