"use client";

import { motion } from "framer-motion";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <div className="flex items-center gap-2">
            <div className="ai-gradient-bg flex h-8 w-8 items-center justify-center rounded-sm text-sm font-bold text-text-primary">
              A
            </div>
            <span className="text-xl font-bold tracking-tight text-text-primary">
              Advoka
            </span>
          </div>
          <p className="text-[13px] text-text-muted">
            Upload the case. Understand it faster. Work smarter.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: [0.2, 0.8, 0.2, 1] }}
          className="w-full"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
