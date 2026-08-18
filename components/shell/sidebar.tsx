"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Scale, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/shell/user-menu";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cases", label: "Cases", icon: Scale },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="ai-gradient-bg flex h-7 w-7 items-center justify-center rounded-sm text-[13px] font-bold text-text-primary">
          A
        </div>
        <span className="text-[15px] font-bold tracking-tight text-text-primary">
          Advoka
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-sm px-2.5 py-2 text-[13.5px] font-medium transition-colors duration-hover ease-advoka",
                active
                  ? "bg-surface-elevated text-text-primary"
                  : "text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary"
              )}
            >
              <Icon
                className={cn(
                  "h-[17px] w-[17px] shrink-0 transition-colors duration-hover",
                  active ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
