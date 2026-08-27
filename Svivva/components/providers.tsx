"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { StaleFeatureBgCleanup } from "@/components/stale-feature-bg-cleanup";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StaleFeatureBgCleanup />
      {children}
    </QueryClientProvider>
  );
}
