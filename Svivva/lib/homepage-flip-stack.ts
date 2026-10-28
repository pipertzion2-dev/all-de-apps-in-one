/** Full-viewport homepage panels — cube faces you scroll through after the game intro. */
export type HomepageFlipPanelId = "home-game" | "home-moves" | "home-beta" | "nav-cube";

/**
 * Continuous cube scroll order (index 0 = top) after the white intro flips away:
 * beta apps → story → white game face.
 * Wrapping past the white face returns to beta with a fine flip — never an
 * infinite jump onto the story face mid-scroll.
 */
export const HOMEPAGE_FLIP_PANELS: readonly HomepageFlipPanelId[] = [
  "home-beta",
  "nav-cube",
  "home-game",
] as const;

export function flipPanelIndex(id: HomepageFlipPanelId): number {
  const idx = HOMEPAGE_FLIP_PANELS.indexOf(id);
  return idx >= 0 ? idx : 0;
}

export function flipPanelFromIndex(index: number): HomepageFlipPanelId {
  return HOMEPAGE_FLIP_PANELS[Math.min(Math.max(index, 0), HOMEPAGE_FLIP_PANELS.length - 1)];
}

/** Section ids inside the combined homepage face. */
export const HOMEPAGE_PLATFORM_SECTION_HASHES = new Set([
  "about",
  "explore",
  "faq",
  "founder-story",
  "how-it-works",
  "pricing",
]);

/** Section ids that live on the beta apps face. */
export const HOMEPAGE_BETA_SECTION_HASHES = new Set(["oaas"]);

export function homepageSectionFromHash(hash: string): string | null {
  const id = hash.replace(/^#/, "").trim();
  if (HOMEPAGE_PLATFORM_SECTION_HASHES.has(id) || HOMEPAGE_BETA_SECTION_HASHES.has(id)) {
    return id;
  }
  return null;
}

export function flipPanelFromHash(hash: string): HomepageFlipPanelId | null {
  const id = hash.replace(/^#/, "").trim();
  // Bare `/` lands on beta apps after the game intro flips into the main app.
  if (!id) return "home-beta";
  if (id === "home-game" || id === "clean-sneaks") return "home-game";
  // Moves Like moved into /play — homepage hashes fall through to beta.
  if (id === "home-moves" || id === "the-moves-like") return "home-beta";
  if (id === "home-beta" || id === "beta-apps") return "home-beta";
  if (id === "nav-cube") return "nav-cube";
  if (id === "home-explore") return "home-beta";
  if (HOMEPAGE_BETA_SECTION_HASHES.has(id)) return "home-beta";
  if (HOMEPAGE_PLATFORM_SECTION_HASHES.has(id)) return "nav-cube";
  return null;
}

export function hashForFlipPanel(id: HomepageFlipPanelId): string {
  return id;
}

export const HOMEPAGE_FLIP_EVENT = "svivva:homepage-flip";

export function dispatchHomepageFlip(panel: HomepageFlipPanelId) {
  window.dispatchEvent(new CustomEvent(HOMEPAGE_FLIP_EVENT, { detail: { panel } }));
}
