"use client";

import { useEffect } from "react";

/** Strip orphaned feature-bg portals left on document.body by older builds. */
export function StaleFeatureBgCleanup() {
  useEffect(() => {
    document.querySelectorAll("body > [data-svivva-feature-bg]").forEach((el) => el.remove());
  }, []);
  return null;
}
