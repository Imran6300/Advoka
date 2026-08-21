"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "@/components/shell/sidebar";

/**
 * §26 Responsive pass — desktop keeps the persistent sidebar (see
 * `sidebar.tsx`, hidden below `lg`). Below that breakpoint the same nav
 * lives in a slide-in drawer behind a top bar, so mobile/tablet get full
 * navigation without the layout breaking — per the build plan, mobile just
 * needs to not break, desktop stays primary.
 */
export function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer automatically on navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 rounded-sm"
          />
          <span className="text-[14px] font-bold tracking-tight text-text-primary">
            Advoka
          </span>
        </div>
        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-sm text-text-secondary transition-colors duration-hover ease-advoka hover:bg-surface-elevated hover:text-text-primary"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-64 max-w-[80vw] border-r border-border bg-surface"
            >
              <SidebarNav />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
