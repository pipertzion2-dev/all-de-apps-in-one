import {
  dispatchHomepageFlip,
  hashForFlipPanel,
  HOMEPAGE_FLIP_PANELS,
  type HomepageFlipPanelId,
} from "./homepage-flip-stack";
import { playHomepageFineFlip, HOMEPAGE_FINE_FLIP_MS } from "./homepage-fine-flip";

export type HomepageScrollPanelId = HomepageFlipPanelId;

export const HOMEPAGE_FLIP_SCROLL_SELECTOR = "[data-homepage-flip-scroll]" as const;

/** Legacy fixed overlay scroller (flip stack). Prefer document scroll when absent. */
export function getHomepageFlipScroller(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(HOMEPAGE_FLIP_SCROLL_SELECTOR);
}

function panelElementId(id: HomepageScrollPanelId): string {
  return id;
}

function panelIndex(id: HomepageScrollPanelId): number {
  return HOMEPAGE_FLIP_PANELS.indexOf(id as (typeof HOMEPAGE_FLIP_PANELS)[number]);
}

/** True when both panels sit next to each other in document order (no loop wrap). */
export function homepagePanelsAreAdjacent(
  from: HomepageScrollPanelId | null | undefined,
  to: HomepageScrollPanelId,
): boolean {
  if (!from) return false;
  const a = panelIndex(from);
  const b = panelIndex(to);
  if (a < 0 || b < 0) return false;
  return Math.abs(a - b) === 1;
}

function nearestVisiblePanel(): HomepageScrollPanelId | null {
  if (typeof document === "undefined" || typeof window === "undefined") return null;
  const center = window.innerHeight / 2;
  let best: HomepageScrollPanelId | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const id of HOMEPAGE_FLIP_PANELS) {
    const el = document.getElementById(id);
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/** Scroll a section id — document scroll, or legacy flip overlay if still mounted. */
export function scrollPlatformSection(
  id: string,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition },
) {
  const behavior = options?.behavior ?? "smooth";
  const block = options?.block ?? "start";
  const target = document.getElementById(id);
  if (!target) return;

  const scroller = getHomepageFlipScroller();
  if (!scroller) {
    target.scrollIntoView({ behavior, block });
    return;
  }

  const scrollerRect = scroller.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const scrollPadding = Number.parseFloat(getComputedStyle(scroller).scrollPaddingTop || "0") || 0;
  const blockOffset =
    block === "center"
      ? (scroller.clientHeight - targetRect.height) / 2
      : block === "end"
        ? scroller.clientHeight - targetRect.height - scrollPadding
        : scrollPadding;

  const nextTop = scroller.scrollTop + (targetRect.top - scrollerRect.top) - blockOffset;
  scroller.scrollTo({ top: Math.max(0, nextTop), behavior });
}

/**
 * Navigate between homepage panels via native scrollIntoView.
 * Falls back to the flip-stack custom event only if panel ids are missing.
 */
export function scrollToHomepagePanel(id: HomepageScrollPanelId) {
  const el = document.getElementById(panelElementId(id));
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `/#${hashForFlipPanel(id)}`);
    return;
  }
  dispatchHomepageFlip(id);
}

/**
 * Cube-face transition into a homepage panel.
 * Adjacent faces (story ↔ game, beta ↔ story) ease with a long flip + smooth scroll.
 * Loop wraps (game ↔ beta) keep a longer flip and jump at the apex so the seam stays soft.
 */
export async function flipToHomepagePanel(
  id: HomepageScrollPanelId,
  opts?: { direction?: "forward" | "back" },
) {
  const direction = opts?.direction ?? "forward";
  const from = nearestVisiblePanel();
  const adjacent = homepagePanelsAreAdjacent(from, id);
  const el = document.getElementById(panelElementId(id));

  const commitHash = () => {
    window.history.replaceState(null, "", `/#${hashForFlipPanel(id)}`);
  };

  if (!el) {
    await playHomepageFineFlip({ direction });
    scrollToHomepagePanel(id);
    return;
  }

  if (adjacent) {
    // Story → game (and other neighbors): overlap smooth scroll with the flip apex.
    await playHomepageFineFlip({
      direction,
      durationMs: HOMEPAGE_FINE_FLIP_MS,
      onApex: () => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        commitHash();
      },
    });
    // Let the smooth scroll settle a beat after the flip eases out.
    await wait(280);
    return;
  }

  // Wrap jump (e.g. game → beta): longer flip, relocate at apex, ease back onto the target.
  const root =
    document.querySelector<HTMLElement>("[data-homepage-native-scroll]") ?? document.body;
  const prevOpacity = root.style.opacity;
  root.style.transition = `opacity ${Math.round(HOMEPAGE_FINE_FLIP_MS * 0.35)}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  root.style.opacity = "0.72";

  await playHomepageFineFlip({
    direction,
    durationMs: Math.round(HOMEPAGE_FINE_FLIP_MS * 1.12),
    peakDeg: 22,
    onApex: () => {
      el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
      commitHash();
      root.style.opacity = "1";
    },
  });

  root.style.opacity = prevOpacity;
}

export {
  flipPanelFromHash,
  hashForFlipPanel,
  homepageSectionFromHash,
  type HomepageFlipPanelId,
} from "./homepage-flip-stack";
