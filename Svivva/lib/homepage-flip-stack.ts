/** Full-viewport homepage panels flipped like the intro Dune cube. */
export type HomepageFlipPanelId = "nav-cube" | "home-game";

/** Flip order after intro: game → product cube. */
export const HOMEPAGE_FLIP_PANELS: readonly HomepageFlipPanelId[] = [
  "home-game",
  "nav-cube",
] as const;

export function flipPanelIndex(id: HomepageFlipPanelId): number {
  return HOMEPAGE_FLIP_PANELS.indexOf(id);
}

export function flipPanelFromIndex(index: number): HomepageFlipPanelId {
  return HOMEPAGE_FLIP_PANELS[Math.min(Math.max(index, 0), HOMEPAGE_FLIP_PANELS.length - 1)];
}

export function flipPanelFromHash(hash: string): HomepageFlipPanelId | null {
  const id = hash.replace(/^#/, "").trim();
  if (!id) return "home-game";
  if (id === "nav-cube") return "nav-cube";
  if (id === "home-game" || id === "clean-sneaks") return "home-game";
  // Legacy explore face — same links live on nav + footer routes now.
  if (id === "home-explore") return "nav-cube";
  return null;
}

export function hashForFlipPanel(id: HomepageFlipPanelId): string {
  return id;
}

export const HOMEPAGE_FLIP_EVENT = "svivva:homepage-flip";

export function dispatchHomepageFlip(panel: HomepageFlipPanelId) {
  window.dispatchEvent(new CustomEvent(HOMEPAGE_FLIP_EVENT, { detail: { panel } }));
}
