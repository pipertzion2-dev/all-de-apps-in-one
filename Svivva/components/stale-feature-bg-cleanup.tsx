"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function purgeLeakedLayers() {
  document
    .querySelectorAll(
      'body > div[aria-hidden].fixed, body > [data-svivva-feature-bg]',
    )
    .forEach((el) => el.remove());
  document.querySelectorAll("body > canvas").forEach((el) => el.remove());
}

/**
 * Remove leaked full-screen layers from older builds (body-portaled Three.js backgrounds).
 */
export function StaleFeatureBgCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    purgeLeakedLayers();
  }, []);

  useEffect(() => {
    purgeLeakedLayers();
  }, [pathname]);

  return null;
}
