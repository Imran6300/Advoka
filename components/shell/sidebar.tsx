"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, Scale, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/shell/user-menu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: Scale },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * The actual nav content, shared between the persistent desktop `Sidebar`
 * and the mobile slide-in drawer (`mobile-app-shell.tsx`) — one definition,
 * two shells, so nav items never drift out of sync between breakpoints.
 *
 * §16/§19 — sized up from the original compact rail (py-2 / 13.5px) so the
 * rail doesn't read as empty: taller rows, a bigger icon tile that lights
 * up on the active item, and a `layoutId`-driven pill that glides between
 * items instead of just swapping a background class.
 */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center gap-2.5 px-5">
        <div className="ai-gradient-bg-animated animate-gradient-x flex h-8 w-8 items-center justify-center rounded-md text-[14px] font-bold text-text-primary shadow-sm">
          A
        </div>
        <span className="text-[16px] font-bold tracking-tight text-text-primary">
          Advoka
        </span>
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[14.5px] font-medium transition-colors duration-hover ease-advoka",
                active
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-md bg-surface-elevated shadow-sm ring-1 ring-border"
                  transition={{ type: "spring", stiffness: 420, bounce: 0.22 }}
                />
              )}
              {!active && (
                <span className="absolute inset-0 rounded-md bg-transparent transition-colors duration-hover ease-advoka group-hover:bg-surface-elevated/60" />
              )}

              <span
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition-all duration-hover ease-advoka",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-text-muted group-hover:bg-surface-elevated group-hover:text-text-secondary"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="relative">{item.label}</span>

              {active && (
                <motion.span
                  layoutId="sidebar-active-dot"
                  className="relative ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 420, bounce: 0.22 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </div>
  );
}

/** Persistent desktop rail — hidden below `lg`, where the mobile drawer takes over. */
export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <SidebarNav />
    </aside>
  );
}
