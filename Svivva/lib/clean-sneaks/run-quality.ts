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

export function runQualityFlags(quality: RunQuality) {
  const mobile = quality === "mobile";
  return {
    quality,
    mobile,
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
    bubbleCount: mobile ? 100 : 180,
    bubbleCountReduced: mobile ? 60 : 120,
    cityBuildings: mobile ? 10 : 20,
    streetLights: mobile ? 6 : 12,
  };
}
