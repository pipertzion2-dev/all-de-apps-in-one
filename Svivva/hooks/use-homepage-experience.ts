"use client";

import { useCallback, useEffect, useState } from "react";

export type HomepageExperience = "site" | "world";

const QUERY_KEY = "world";

/**
 * Homepage experience switch.
 * Default is always the business site UI. World is opt-in for the session
 * (or via ?world=1) so the marketing page stays sales-friendly.
 */
export function useHomepageExperience() {
  const [experience, setExperienceState] = useState<HomepageExperience>("site");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get(QUERY_KEY) === "1" || params.get("experience") === "world") {
        setExperienceState("world");
      }
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const syncUrl = useCallback((next: HomepageExperience) => {
    try {
      const url = new URL(window.location.href);
      if (next === "world") url.searchParams.set(QUERY_KEY, "1");
      else url.searchParams.delete(QUERY_KEY);
      url.searchParams.delete("experience");
      const qs = url.searchParams.toString();
      window.history.replaceState({}, "", `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`);
    } catch {
      /* ignore */
    }
  }, []);

  const setExperience = useCallback(
    (next: HomepageExperience) => {
      setExperienceState(next);
      syncUrl(next);
      if (next === "world") {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    },
    [syncUrl],
  );

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return {
    experience,
    ready,
    isWorld: experience === "world",
    enterWorld: () => setExperience("world"),
    exitWorld: () => setExperience("site"),
    setExperience,
  };
}
