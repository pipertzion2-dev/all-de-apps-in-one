import type { HomepageFlipPanelId } from "./homepage-flip-stack";
import { HOMEPAGE_FLIP_PANELS } from "./homepage-flip-stack";

/** px from a panel edge before a wheel/touch is treated as a cube wrap. */
export const HOMEPAGE_CUBE_LOOP_EDGE_PX = 64;

/** Ignore further wraps while a wrap animation is in flight. */
export const HOMEPAGE_CUBE_LOOP_COOLDOWN_MS = 900;

export function homepageCubeLoopPanels(): readonly HomepageFlipPanelId[] {
  return HOMEPAGE_FLIP_PANELS;
}

/** Next face when scrolling forward (down): beta → story → game → beta … */
export function nextCubeLoopPanel(current: HomepageFlipPanelId): HomepageFlipPanelId {
  const panels = homepageCubeLoopPanels();
  const idx = panels.indexOf(current);
  if (idx < 0) return panels[0];
  return panels[(idx + 1) % panels.length];
}

/** Previous face when scrolling backward (up). */
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

/** Panel whose vertical center is closest to the viewport center. */
export function nearestHomepagePanel(
  doc: Document = document,
  win: Window = window,
): HomepageFlipPanelId | null {
  const panels = homepageCubeLoopPanels();
  const center = (win.innerHeight || 800) / 2;
  let best: HomepageFlipPanelId | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const id of panels) {
    const el = doc.getElementById(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.height <= 0) continue;
    const mid = rect.top + rect.height / 2;
    const score = Math.abs(mid - center);
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }

  return best;
}

export function isNearPanelBottom(
  id: HomepageFlipPanelId,
  edgePx: number = HOMEPAGE_CUBE_LOOP_EDGE_PX,
  doc: Document = document,
  win: Window = window,
): boolean {
  const el = doc.getElementById(id);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const vh = win.innerHeight || 0;
  // Panel bottom has reached / passed the viewport bottom.
  return rect.bottom <= vh + edgePx;
}

export function isNearPanelTop(
  id: HomepageFlipPanelId,
  edgePx: number = HOMEPAGE_CUBE_LOOP_EDGE_PX,
  doc: Document = document,
): boolean {
  const el = doc.getElementById(id);
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.top >= -edgePx && rect.top <= edgePx;
}

/**
 * Panel-aware wrap:
 * - From the story face (nav-cube) scrolling down → white game (home-game)
 * - From the game face scrolling down → beta (home-beta)
 * - From beta scrolling up → game
 * - From game scrolling up → story
 */
export function cubeLoopWrapTarget(
  deltaY: number,
  opts?: {
    activePanel?: HomepageFlipPanelId | null;
    nearPanelBottom?: boolean;
    nearPanelTop?: boolean;
    nearBottom?: boolean;
    nearTop?: boolean;
    panels?: readonly HomepageFlipPanelId[];
  },
): HomepageFlipPanelId | null {
  if (deltaY === 0 || !Number.isFinite(deltaY)) return null;
  const panels = opts?.panels ?? homepageCubeLoopPanels();
  if (panels.length < 2) return null;

  const active = opts?.activePanel ?? null;

  if (deltaY > 0) {
    if (active && (opts?.nearPanelBottom ?? false)) {
      return nextCubeLoopPanel(active);
    }
    // Document-bottom fallback only when the last face is active / present.
    if (opts?.nearBottom) {
      const last = panels[panels.length - 1];
      if (!active || active === last) return nextCubeLoopPanel(last);
    }
    return null;
  }

  if (deltaY < 0) {
    if (active && (opts?.nearPanelTop ?? false)) {
      return prevCubeLoopPanel(active);
    }
    if (opts?.nearTop) {
      const first = panels[0];
      if (!active || active === first) return prevCubeLoopPanel(first);
    }
    return null;
  }

  return null;
}
