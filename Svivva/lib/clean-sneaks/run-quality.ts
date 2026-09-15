export type RunQuality = "full" | "mobile";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || isIOS();
}

/** True when the viewport is taller than wide (iPhone vertical). */
export function isPortraitViewport(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerHeight > window.innerWidth;
}

/** Width / height — lower on tall phones (~0.46 on iPhone). */
export function viewportAspect(): number {
  if (typeof window === "undefined") return 1;
  return window.innerWidth / Math.max(window.innerHeight, 1);
}

/**
 * Multiplier for portrait camera distance / FOV — narrow screens need a wider,
 * farther rig so the left/right shoe pair stays in frame.
 */
export function portraitFramingBoost(): number {
  if (!isPortraitViewport()) return 1;
  const aspect = viewportAspect();
  // iPhone 14 portrait ≈ 0.46; iPad portrait ≈ 0.75
  return Math.min(1.55, Math.max(1, 0.52 / Math.max(aspect, 0.38)));
}

/** True when WebGL can be created at all (used before mounting R3F). */
export function canCreateWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ??
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    return gl != null;
  } catch {
    return false;
  }
}

/** Scene feature tier — mobile/iOS skips heavy post-FX, PMREM, shadows. */
export function detectRunQuality(): RunQuality {
  if (typeof window === "undefined") return "full";
  if (isMobileViewport() || isIOS()) return "mobile";
  return "full";
}

export function runQualityFlags(quality: RunQuality, portrait = isPortraitViewport()) {
  const mobile = quality === "mobile";
  return {
    quality,
    mobile,
    portrait,
    postFx: !mobile,
    /** Physical Baloon8 materials need an env map — lite PMREM on mobile. */
    pmremEnvironment: true,
    pmremLite: mobile,
    castShadows: !mobile,
    contactShadows: !mobile,
    sky: !mobile,
    sparkles: !mobile,
    speedStreaks: !mobile,
    antialias: !mobile,
    dpr: mobile || typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    /** Quilted balloon pod preference for the Tripo coupe (per pair before caps). */
    bubbleCount: mobile ? 2200 : 4000,
    bubbleCountReduced: mobile ? 1400 : 2400,
    cityBuildings: mobile ? 10 : 20,
    streetLights: mobile ? 6 : 12,
  };
}
