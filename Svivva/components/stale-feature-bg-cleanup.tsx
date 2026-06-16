"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function purgeLeakedLayers() {
  document
    .querySelectorAll(
      "body > canvas, body > div.fixed.inset-0, body > div[aria-hidden].fixed, body > [data-svivva-feature-bg]",
    )
    .forEach((el) => el.remove());

  document.querySelectorAll("body > canvas").forEach((node) => {
    const canvas = node as HTMLCanvasElement;
    if (canvas.height > window.innerHeight * 1.25) canvas.remove();
  });
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
