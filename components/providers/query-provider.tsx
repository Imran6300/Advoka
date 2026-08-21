"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            // Perf pass: a short default staleTime means switching between
            // case tabs (or navigating away and back) reuses the cached
            // response instead of firing an immediate refetch on every
            // remount — the explicit refetchInterval on each polling hook
            // still keeps genuinely in-flight data (analysis/graph/status)
            // fresh regardless of this value.
            staleTime: 5000,
            gcTime: 5 * 60 * 1000,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
