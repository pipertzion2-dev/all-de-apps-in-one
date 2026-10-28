import {
  dispatchHomepageFlip,
  hashForFlipPanel,
  type HomepageFlipPanelId,
} from "./homepage-flip-stack";
import { playHomepageFineFlip } from "./homepage-fine-flip";

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
 * Same as {@link scrollToHomepagePanel}, with a short cube-face rotateX first.
 * Used when wrapping past the ends of the continuous homepage.
 */
export async function flipToHomepagePanel(
  id: HomepageScrollPanelId,
  opts?: { direction?: "forward" | "back" },
) {
  const direction = opts?.direction ?? "forward";
  await playHomepageFineFlip({ direction });
  const el = document.getElementById(panelElementId(id));
  if (el) {
    el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
    window.history.replaceState(null, "", `/#${hashForFlipPanel(id)}`);
    return;
  }
  scrollToHomepagePanel(id);
}

export {
  flipPanelFromHash,
  hashForFlipPanel,
  homepageSectionFromHash,
  type HomepageFlipPanelId,
} from "./homepage-flip-stack";
