"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Navbar } from "@/components/marketing/sections/navbar";
import { Footer } from "@/components/marketing/sections/footer";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-32 sm:pt-36">
        <div className="flex w-full max-w-md flex-col items-center gap-8">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="flex flex-col items-center gap-2 text-center"
          >
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt=""
                width={32}
                height={32}
                priority
                className="h-8 w-8 shrink-0 rounded-sm"
              />
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
      </main>

      <Footer />
    </div>
  );
}
