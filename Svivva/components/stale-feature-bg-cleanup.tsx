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

function trimTrailingScroll() {
  const shell = document.querySelector(
    "[data-landing-page], [data-page-shell], [data-feature-page]",
  ) as HTMLElement | null;
  if (!shell) return;

  const contentBottom = shell.offsetTop + shell.offsetHeight;

  document.querySelectorAll("body > canvas").forEach((node) => {
    const canvas = node as HTMLCanvasElement;
    const top = canvas.offsetTop;
    if (top >= contentBottom - 8) canvas.remove();
  });

  document.querySelectorAll("body > div").forEach((node) => {
    const el = node as HTMLElement;
    if (el.contains(shell) || shell.contains(el)) return;
    if (el.hasAttribute("data-svivva-feature-bg")) return;
    const top = el.offsetTop;
    if (top >= contentBottom - 8 && el.classList.contains("fixed")) el.remove();
  });
}

function runPageHygiene() {
  purgeLeakedLayers();
  trimTrailingScroll();
}

/**
 * Remove leaked full-screen layers from older builds (body-portaled Three.js backgrounds).
 */
export function StaleFeatureBgCleanup() {
  const pathname = usePathname();

  useEffect(() => {
    runPageHygiene();
    const t1 = window.setTimeout(runPageHygiene, 400);
    const t2 = window.setTimeout(runPageHygiene, 1500);
    window.addEventListener("resize", runPageHygiene);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", runPageHygiene);
    };
  }, []);

  useEffect(() => {
    runPageHygiene();
    const t = window.setTimeout(runPageHygiene, 400);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return null;
}
