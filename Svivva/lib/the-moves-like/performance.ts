"use client";

export type RenderQuality = "low" | "medium" | "high";

export function detectRenderQuality(): RenderQuality {
  if (typeof window === "undefined") return "medium";

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  if (reduced) return "low";

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia?.("(pointer: coarse)")?.matches === true;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (mem !== undefined && mem <= 2) return "low";
  if (coarse && cores <= 4) return "low";
  if (cores >= 8 && dpr <= 2 && (mem === undefined || mem >= 4)) return "high";
  return "medium";
}

export function particleBudget(quality: RenderQuality): number {
  if (quality === "high") return 220;
  if (quality === "medium") return 110;
  return 40;
}

export function dprCap(quality: RenderQuality): number {
  if (quality === "high")
    return Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 2);
  if (quality === "medium")
    return Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, 1.5);
  return 1;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
}
