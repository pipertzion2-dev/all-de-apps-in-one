"use client";

import { useCallback, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

/** Soft auth gate — browse freely; prompt sign-in only when starting work. */
export function useFeatureAuthGate() {
  const pathname = usePathname() || "/";
  const { isAuthenticated, isLoading } = useAuth();

  const signInHref = useMemo(
    () => `/login?redirect=${encodeURIComponent(pathname)}`,
    [pathname],
  );

  const signupHref = useMemo(
    () => `/signup?redirect=${encodeURIComponent(pathname)}`,
    [pathname],
  );

  const requireAuth = useCallback((): boolean => {
    if (isLoading || isAuthenticated) return true;
    window.location.href = signInHref;
    return false;
  }, [isAuthenticated, isLoading, signInHref]);

  return {
    isAuthenticated,
    isLoading,
    signInHref,
    signupHref,
    requireAuth,
  };
}
