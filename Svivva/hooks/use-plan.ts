"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export type Plan = "free" | "pro" | "enterprise";

export function usePlan() {
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery<{ plan: Plan }>({
    queryKey: ["/api/stripe/subscription"],
    queryFn: () => fetch("/api/stripe/subscription", { credentials: "include" }).then(r => r.json()),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const plan: Plan = data?.plan ?? "free";

  return {
    plan,
    isPro: plan === "pro" || plan === "enterprise",
    isEnterprise: plan === "enterprise",
    isFree: plan === "free",
    isLoading,
  };
}
