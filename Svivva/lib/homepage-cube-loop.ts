import type { HomepageFlipPanelId } from "./homepage-flip-stack";
import { HOMEPAGE_FLIP_PANELS } from "./homepage-flip-stack";

/** px from document edge before a wheel/touch is treated as a cube wrap. */
export const HOMEPAGE_CUBE_LOOP_EDGE_PX = 48;

/** Ignore further wraps while a wrap animation is in flight. */
export const HOMEPAGE_CUBE_LOOP_COOLDOWN_MS = 900;

export function homepageCubeLoopPanels(): readonly HomepageFlipPanelId[] {
  return HOMEPAGE_FLIP_PANELS;
}

/** Next face when scrolling forward (down) past the last face → first face. */
export function nextCubeLoopPanel(current: HomepageFlipPanelId): HomepageFlipPanelId {
  const panels = homepageCubeLoopPanels();
  const idx = panels.indexOf(current);
  if (idx < 0) return panels[0];
  return panels[(idx + 1) % panels.length];
}

/** Previous face when scrolling backward (up) past the first face → last face. */
export function prevCubeLoopPanel(current: HomepageFlipPanelId): HomepageFlipPanelId {
  const panels = homepageCubeLoopPanels();
  const idx = panels.indexOf(current);
  if (idx < 0) return panels[panels.length - 1];
  return panels[(idx - 1 + panels.length) % panels.length];
}

export function documentScrollMetrics(win: Window = window, doc: Document = document) {
  const el = doc.documentElement;
  const scrollTop = win.scrollY || el.scrollTop || 0;
  const viewport = win.innerHeight || el.clientHeight || 0;
  const scrollHeight = Math.max(el.scrollHeight, doc.body?.scrollHeight ?? 0);
  const maxScroll = Math.max(0, scrollHeight - viewport);
  return { scrollTop, viewport, scrollHeight, maxScroll };
}

export function isNearDocumentBottom(
  edgePx: number = HOMEPAGE_CUBE_LOOP_EDGE_PX,
  win: Window = window,
  doc: Document = document,
): boolean {
  const { scrollTop, maxScroll } = documentScrollMetrics(win, doc);
  return scrollTop >= maxScroll - edgePx;
}

export function isNearDocumentTop(
  edgePx: number = HOMEPAGE_CUBE_LOOP_EDGE_PX,
  win: Window = window,
  doc: Document = document,
): boolean {
  const { scrollTop } = documentScrollMetrics(win, doc);
  return scrollTop <= edgePx;
}

/**
 * Which panel should receive a wrap given wheel/touch delta.
 * Positive delta = scroll down → wrap from last face to first when at bottom.
 * Negative delta = scroll up → wrap from first face to last when at top.
 */
export function cubeLoopWrapTarget(
  deltaY: number,
  opts?: {
    nearBottom?: boolean;
    nearTop?: boolean;
    panels?: readonly HomepageFlipPanelId[];
  },
): HomepageFlipPanelId | null {
  if (deltaY === 0 || !Number.isFinite(deltaY)) return null;
  const panels = opts?.panels ?? homepageCubeLoopPanels();
  if (panels.length < 2) return null;

  if (deltaY > 0 && (opts?.nearBottom ?? false)) {
    return panels[0];
  }
  if (deltaY < 0 && (opts?.nearTop ?? false)) {
    return panels[panels.length - 1];
  }
  return null;
}
