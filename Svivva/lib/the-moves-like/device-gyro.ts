/**
 * Device orientation / motion helpers for iPhone + Android.
 * iOS 13+ requires DeviceOrientationEvent.requestPermission() from a user gesture.
 * Elsewhere (and when already granted), listening can start automatically.
 */

export type GyroSample = {
  /** Compass heading around Z (0–360), or null */
  alpha: number | null;
  /** Front-to-back tilt (−180–180) */
  beta: number | null;
  /** Left-to-right tilt (−90–90) */
  gamma: number | null;
  acceleration: { x: number; y: number; z: number } | null;
  rotationRate: { alpha: number; beta: number; gamma: number } | null;
  timestamp: number;
};

export type GyroPermissionState =
  | "unsupported"
  | "prompt"
  | "granted"
  | "denied"
  | "listening"
  | "unavailable";

type OrientationPermissionFn = () => Promise<"granted" | "denied">;

function orientationPermissionApi(): OrientationPermissionFn | null {
  if (typeof window === "undefined") return null;
  const DOE = window.DeviceOrientationEvent as
    | (typeof DeviceOrientationEvent & { requestPermission?: OrientationPermissionFn })
    | undefined;
  if (DOE && typeof DOE.requestPermission === "function") {
    return DOE.requestPermission.bind(DOE);
  }
  return null;
}

function motionPermissionApi(): OrientationPermissionFn | null {
  if (typeof window === "undefined") return null;
  const DME = window.DeviceMotionEvent as
    | (typeof DeviceMotionEvent & { requestPermission?: OrientationPermissionFn })
    | undefined;
  if (DME && typeof DME.requestPermission === "function") {
    return DME.requestPermission.bind(DME);
  }
  return null;
}

/** True on iOS Safari / WKWebView where a gesture-gated permission prompt is required. */
export function needsGyroUserGesture(): boolean {
  return Boolean(orientationPermissionApi() || motionPermissionApi());
}

export function isGyroSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.DeviceOrientationEvent !== "undefined" ||
    typeof window.DeviceMotionEvent !== "undefined"
  );
}

/**
 * Request permission when the platform requires it.
 * Safe to call from a click/tap handler. No-ops to "granted" when no API exists.
 */
export async function requestGyroPermission(): Promise<"granted" | "denied" | "unavailable"> {
  if (!isGyroSupported()) return "unavailable";
  const orient = orientationPermissionApi();
  const motion = motionPermissionApi();
  if (!orient && !motion) return "granted";

  try {
    const results: Array<"granted" | "denied"> = [];
    if (orient) results.push(await orient());
    if (motion) {
      try {
        results.push(await motion());
      } catch {
        // Orientation alone is enough for tilt
      }
    }
    if (results.includes("granted")) return "granted";
    return "denied";
  } catch {
    return "denied";
  }
}

/** Map raw orientation into gentle camera offsets (radians-ish degrees scaled). */
export function gyroToCameraOffset(sample: GyroSample | null): { x: number; y: number } {
  if (!sample) return { x: 0, y: 0 };
  const beta = sample.beta ?? 0;
  const gamma = sample.gamma ?? 0;
  // Neutral phone-upright ~60–80° beta; center around 55°
  const tiltX = ((beta - 55) / 90) * 0.55;
  const tiltY = (gamma / 90) * 0.7;
  return {
    x: Math.max(-0.85, Math.min(0.85, tiltX)),
    y: Math.max(-0.95, Math.min(0.95, tiltY)),
  };
}

/** Scalar motion energy from rotation rate / acceleration — for UI meters. */
export function gyroMotionEnergy(sample: GyroSample | null): number {
  if (!sample) return 0;
  const rr = sample.rotationRate;
  const acc = sample.acceleration;
  let e = 0;
  if (rr) {
    e += Math.min(1, (Math.abs(rr.alpha) + Math.abs(rr.beta) + Math.abs(rr.gamma)) / 360);
  }
  if (acc) {
    // Subtract gravity-ish baseline on z when possible
    const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    e += Math.min(1, Math.abs(mag - 9.8) / 12);
  }
  return Math.max(0, Math.min(1, e));
}

let latestSample: GyroSample | null = null;

export function publishGyroSample(sample: GyroSample | null) {
  latestSample = sample;
}

export function readGyroSample(): GyroSample | null {
  return latestSample;
}

export function sampleFromOrientationEvent(e: DeviceOrientationEvent): GyroSample {
  return {
    alpha: typeof e.alpha === "number" ? e.alpha : null,
    beta: typeof e.beta === "number" ? e.beta : null,
    gamma: typeof e.gamma === "number" ? e.gamma : null,
    acceleration: null,
    rotationRate: null,
    timestamp: performance.now(),
  };
}

export function mergeMotionEvent(base: GyroSample | null, e: DeviceMotionEvent): GyroSample {
  const acc = e.accelerationIncludingGravity ?? e.acceleration;
  const rr = e.rotationRate;
  return {
    alpha: base?.alpha ?? null,
    beta: base?.beta ?? null,
    gamma: base?.gamma ?? null,
    acceleration: acc
      ? { x: acc.x ?? 0, y: acc.y ?? 0, z: acc.z ?? 0 }
      : (base?.acceleration ?? null),
    rotationRate: rr
      ? { alpha: rr.alpha ?? 0, beta: rr.beta ?? 0, gamma: rr.gamma ?? 0 }
      : (base?.rotationRate ?? null),
    timestamp: performance.now(),
  };
}
