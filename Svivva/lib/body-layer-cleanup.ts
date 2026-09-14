/** Intentional body-portaled UI (games, modals) — never remove during stale-layer hygiene. */
export const SVIVVA_APP_SHELL_ATTR = "data-svivva-app-shell";

export function isProtectedBodyLayer(el: Element): boolean {
  return el.hasAttribute(SVIVVA_APP_SHELL_ATTR) || el.hasAttribute("data-clean-sneaks-fullscreen");
}

/** Remove leaked full-screen layers from older builds (body-portaled Three.js backgrounds). */
export function purgeStaleBodyLayers(): void {
  document
    .querySelectorAll(
      "body > canvas, body > div.fixed.inset-0, body > div[aria-hidden].fixed, body > [data-svivva-feature-bg]",
    )
    .forEach((el) => {
      if (isProtectedBodyLayer(el)) return;
      el.remove();
    });

  document.querySelectorAll("body > canvas").forEach((node) => {
    if (isProtectedBodyLayer(node)) return;
    const canvas = node as HTMLCanvasElement;
    if (canvas.height > window.innerHeight * 1.25) canvas.remove();
  });
}

export function trimTrailingBodyScroll(): void {
  const shell = document.querySelector(
    "[data-landing-page], [data-page-shell], [data-feature-page]",
  ) as HTMLElement | null;
  if (!shell) return;

  const contentBottom = shell.offsetTop + shell.offsetHeight;

  document.querySelectorAll("body > canvas").forEach((node) => {
    if (isProtectedBodyLayer(node)) return;
    const canvas = node as HTMLCanvasElement;
    const top = canvas.offsetTop;
    if (top >= contentBottom - 8) canvas.remove();
  });

  document.querySelectorAll("body > div").forEach((node) => {
    const el = node as HTMLElement;
    if (isProtectedBodyLayer(el)) return;
    if (el.contains(shell) || shell.contains(el)) return;
    if (el.hasAttribute("data-svivva-feature-bg")) return;
    const top = el.offsetTop;
    if (top >= contentBottom - 8 && el.classList.contains("fixed")) el.remove();
  });
}

export function runBodyLayerHygiene(): void {
  purgeStaleBodyLayers();
  trimTrailingBodyScroll();
}
