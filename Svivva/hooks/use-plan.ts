"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export type Plan = "free" | "pro" | "enterprise";

export function usePlan() {
  const { isAuthenticated } = useAuth();

  const { data: meData, isLoading: meLoading } = useQuery<{
    isMembershipAccess?: boolean;
    isAdmin?: boolean;
  }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    staleTime: 60_000,
  });

  const { data, isLoading: subLoading } = useQuery<{ plan: Plan }>({
    queryKey: ["/api/stripe/subscription"],
    queryFn: () =>
      fetch("/api/stripe/subscription", { credentials: "include" }).then((r) => r.json()),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const bypass = Boolean(meData?.isMembershipAccess || meData?.isAdmin);
  const plan: Plan = bypass ? "pro" : (data?.plan ?? "free");
  const isLoading = meLoading || (isAuthenticated && subLoading);

  return {
    plan,
    isPro: plan === "pro" || plan === "enterprise",
    isEnterprise: plan === "enterprise",
    isFree: plan === "free",
    isLoading,
    isMembershipAccess: Boolean(meData?.isMembershipAccess),
  };
}
