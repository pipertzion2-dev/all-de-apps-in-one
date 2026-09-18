import type { HomepageJourneyFace } from "./homepage-cube-journey";
import { hashForJourneyFace, journeyFaceFromHash } from "./homepage-cube-journey";

export type HomepageScrollPanelId = "nav-cube" | "home-game" | "home-explore";

const PANEL_TO_JOURNEY: Record<HomepageScrollPanelId, HomepageJourneyFace> = {
  "nav-cube": "begin",
  "home-game": "game",
  "home-explore": "home",
};

/** Dispatch a custom event so the journey cube can navigate without scroll snap. */
export function scrollToHomepagePanel(id: HomepageScrollPanelId) {
  const face = PANEL_TO_JOURNEY[id];
  window.dispatchEvent(
    new CustomEvent("svivva:homepage-journey", { detail: { face, hash: hashForJourneyFace(face) } }),
  );
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function journeyFaceFromPanelId(id: HomepageScrollPanelId): HomepageJourneyFace {
  return PANEL_TO_JOURNEY[id];
}

export { journeyFaceFromHash, hashForJourneyFace };
