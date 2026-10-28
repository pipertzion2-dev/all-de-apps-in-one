/**
 * Vertical cube-face flip used when moving between homepage faces.
 * Longer ease-in-out arc so wraps (especially story → white game) feel continuous.
 */

export const HOMEPAGE_FINE_FLIP_MS = 820;
/** Peak tilt (deg) — enough presence without feeling abrupt. */
export const HOMEPAGE_FINE_FLIP_PEAK_DEG = 18;
/** Fraction of the timeline where the tilt peaks (then eases back). */
export const HOMEPAGE_FINE_FLIP_PEAK_AT = 0.42;

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Smoothstep between two points on [0,1]. */
export function fineFlipAngleProgress(t: number, peakAt = HOMEPAGE_FINE_FLIP_PEAK_AT): number {
  const x = Math.min(1, Math.max(0, t));
  if (x <= peakAt) {
    return easeInOutCubic(x / peakAt);
  }
  return 1 - easeInOutCubic((x - peakAt) / (1 - peakAt));
}

export function playHomepageFineFlip(opts?: {
  direction?: "forward" | "back";
  durationMs?: number;
  peakDeg?: number;
  root?: HTMLElement | null;
  /** Called once near the tilt apex (useful to start a smooth scroll). */
  onApex?: () => void;
}): Promise<void> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return Promise.resolve();
  }

  const duration = opts?.durationMs ?? HOMEPAGE_FINE_FLIP_MS;
  const peakDeg = opts?.peakDeg ?? HOMEPAGE_FINE_FLIP_PEAK_DEG;
  const direction = opts?.direction ?? "forward";
  const sign = direction === "forward" ? -1 : 1;
  const root =
    opts?.root ??
    document.querySelector<HTMLElement>("[data-homepage-native-scroll]") ??
    document.body;

  const prevTransition = root.style.transition;
  const prevTransform = root.style.transform;
  const prevOrigin = root.style.transformOrigin;
  const prevWillChange = root.style.willChange;
  const prevFilter = root.style.filter;

  root.style.transformOrigin = "50% 42%";
  root.style.transition = "none";
  root.style.willChange = "transform, filter";

  let apexFired = false;
  const started = performance.now();

  return new Promise((resolve) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / duration);
      const amp = fineFlipAngleProgress(t);
      const angle = sign * peakDeg * amp;
      // Soft depth cue — never goes fully dark.
      const dim = 1 - amp * 0.08;
      root.style.transform = `perspective(1800px) rotateX(${angle.toFixed(3)}deg) scale(${(1 - amp * 0.018).toFixed(4)})`;
      root.style.filter = `brightness(${dim.toFixed(3)})`;

      if (!apexFired && t >= HOMEPAGE_FINE_FLIP_PEAK_AT) {
        apexFired = true;
        opts?.onApex?.();
      }

      if (t < 1) {
        window.requestAnimationFrame(tick);
        return;
      }

      root.style.transition = prevTransition;
      root.style.transform = prevTransform;
      root.style.transformOrigin = prevOrigin;
      root.style.willChange = prevWillChange;
      root.style.filter = prevFilter;
      resolve();
    };

    window.requestAnimationFrame(tick);
  });
}
