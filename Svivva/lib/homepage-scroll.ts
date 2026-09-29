import { dispatchHomepageFlip, type HomepageFlipPanelId } from "./homepage-flip-stack";

export type HomepageScrollPanelId = HomepageFlipPanelId;

export const HOMEPAGE_FLIP_SCROLL_SELECTOR = "[data-homepage-flip-scroll]" as const;

/** Fixed overlay that scrolls the platform (page 3) face — not `window`. */
export function getHomepageFlipScroller(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(HOMEPAGE_FLIP_SCROLL_SELECTOR);
}

/** Scroll a section id inside the platform overlay (fallback: document scroll). */
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
  const scrollPadding =
    Number.parseFloat(getComputedStyle(scroller).scrollPaddingTop || "0") || 0;
  const blockOffset =
    block === "center"
      ? (scroller.clientHeight - targetRect.height) / 2
      : block === "end"
        ? scroller.clientHeight - targetRect.height - scrollPadding
        : scrollPadding;

  const nextTop = scroller.scrollTop + (targetRect.top - scrollerRect.top) - blockOffset;
  scroller.scrollTo({ top: Math.max(0, nextTop), behavior });
}

/** Navigate between homepage flip faces (begin → game → home). */
export function scrollToHomepagePanel(id: HomepageScrollPanelId) {
  dispatchHomepageFlip(id);
}

export {
  flipPanelFromHash,
  hashForFlipPanel,
  type HomepageFlipPanelId,
} from "./homepage-flip-stack";
