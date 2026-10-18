/** Full-viewport homepage panels flipped like the intro Dune cube. */
export type HomepageFlipPanelId = "nav-cube" | "home-game";

/** Flip order: The Moves Like product face → Klean Sneaks demo. */
export const HOMEPAGE_FLIP_PANELS: readonly HomepageFlipPanelId[] = [
  "nav-cube",
  "home-game",
] as const;

export function flipPanelIndex(id: HomepageFlipPanelId): number {
  return HOMEPAGE_FLIP_PANELS.indexOf(id);
}

export function flipPanelFromIndex(index: number): HomepageFlipPanelId {
  return HOMEPAGE_FLIP_PANELS[Math.min(Math.max(index, 0), HOMEPAGE_FLIP_PANELS.length - 1)];
}

/** Section ids inside the platform scroll overlay (third homepage face). */
export const HOMEPAGE_PLATFORM_SECTION_HASHES = new Set([
  "about",
  "explore",
  "faq",
  "founder-story",
  "how-it-works",
  "oaas",
  "pricing",
]);

export function homepageSectionFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, "").trim();
  return HOMEPAGE_PLATFORM_SECTION_HASHES.has(id) ? id : null;
}

export function flipPanelFromHash(hash: string): HomepageFlipPanelId | null {
  const id = hash.replace(/^#/, "").trim();
  if (!id) return "nav-cube";
  if (id === "nav-cube") return "nav-cube";
  if (id === "home-game" || id === "clean-sneaks") return "home-game";
  // Retired explore face — land on The Moves Like homepage instead.
  if (id === "home-explore") return "nav-cube";
  if (homepageSectionFromHash(id)) return "nav-cube";
  return null;
}

export function hashForFlipPanel(id: HomepageFlipPanelId): string {
  return id;
}

export const HOMEPAGE_FLIP_EVENT = "svivva:homepage-flip";

export function dispatchHomepageFlip(panel: HomepageFlipPanelId) {
  window.dispatchEvent(new CustomEvent(HOMEPAGE_FLIP_EVENT, { detail: { panel } }));
}
