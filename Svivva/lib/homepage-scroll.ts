import {
  dispatchHomepageFlip,
  type HomepageFlipPanelId,
} from "./homepage-flip-stack";

export type HomepageScrollPanelId = HomepageFlipPanelId;

/** Navigate between homepage flip faces (begin → game → home). */
export function scrollToHomepagePanel(id: HomepageScrollPanelId) {
  dispatchHomepageFlip(id);
}

export {
  flipPanelFromHash,
  hashForFlipPanel,
  type HomepageFlipPanelId,
} from "./homepage-flip-stack";
