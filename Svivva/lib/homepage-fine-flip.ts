/**
 * Short vertical cube-face flip used when wrapping between homepage faces.
 * Keeps native document scroll; only paints a brief rotateX on the scroll root.
 */

export const HOMEPAGE_FINE_FLIP_MS = 420;

export function playHomepageFineFlip(opts?: {
  direction?: "forward" | "back";
  durationMs?: number;
  root?: HTMLElement | null;
}): Promise<void> {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return Promise.resolve();
  }

  const duration = opts?.durationMs ?? HOMEPAGE_FINE_FLIP_MS;
  const direction = opts?.direction ?? "forward";
  const root =
    opts?.root ??
    document.querySelector<HTMLElement>("[data-homepage-native-scroll]") ??
    document.body;

  const angle = direction === "forward" ? -12 : 12;
  const prevTransition = root.style.transition;
  const prevTransform = root.style.transform;
  const prevOrigin = root.style.transformOrigin;
  const prevPerspective = (root.style as CSSStyleDeclaration & { perspective?: string })
    .perspective;

  root.style.transformOrigin = "50% 50%";
  root.style.transition = `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`;
  root.style.transform = `perspective(1600px) rotateX(${angle}deg)`;

  return new Promise((resolve) => {
    window.setTimeout(() => {
      root.style.transform = "perspective(1600px) rotateX(0deg)";
      window.setTimeout(() => {
        root.style.transition = prevTransition;
        root.style.transform = prevTransform;
        root.style.transformOrigin = prevOrigin;
        if (prevPerspective != null) {
          (root.style as CSSStyleDeclaration & { perspective?: string }).perspective =
            prevPerspective;
        }
        resolve();
      }, duration);
    }, duration * 0.45);
  });
}
