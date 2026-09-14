"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { runBodyLayerHygiene } from "@/lib/body-layer-cleanup";

/**
 * Remove leaked full-screen layers from older builds (body-portaled Three.js backgrounds).
 */
export function StaleFeatureBgCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    runBodyLayerHygiene();
    const t1 = window.setTimeout(runBodyLayerHygiene, 400);
    const t2 = window.setTimeout(runBodyLayerHygiene, 1500);
    window.addEventListener("resize", runBodyLayerHygiene);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", runBodyLayerHygiene);
    };
  }, []);

  useEffect(() => {
    runBodyLayerHygiene();
    const t = window.setTimeout(runBodyLayerHygiene, 400);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}
