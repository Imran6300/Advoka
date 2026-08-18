"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronsUpDown, LogOut, Settings, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export function UserMenu() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const name = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Your account";
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (user?.firstName?.[0] ?? name[0] ?? "?").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-sm px-2 py-2 text-left transition-colors duration-hover hover:bg-surface-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-[13px] font-semibold text-text-secondary">
          {isLoaded ? initial : ""}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-text-primary">
            {isLoaded ? name : "Loading…"}
          </p>
          {email && <p className="truncate text-[12px] text-text-muted">{email}</p>}
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-text-muted" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel>Signed in as {isLoaded ? name : "…"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <UserIcon className="h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => signOut({ redirectUrl: "/sign-in" })}>
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
