/** Full-viewport homepage panels — four cube faces you scroll through. */
export type HomepageFlipPanelId = "home-game" | "home-moves" | "home-beta" | "nav-cube";

/**
 * Cube scroll order (index 0 = top):
 * The Moves Like → beta apps → combined (about / pricing / FAQ) → Klean Sneaks.
 * Default land is home-moves so the lead product opens first; Klean Sneaks closes the cube.
 */
export const HOMEPAGE_FLIP_PANELS: readonly HomepageFlipPanelId[] = [
  "home-moves",
  "home-beta",
  "nav-cube",
  "home-game",
] as const;

export function flipPanelIndex(id: HomepageFlipPanelId): number {
  return HOMEPAGE_FLIP_PANELS.indexOf(id);
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
  // Bare `/` lands on The Moves Like — Klean Sneaks is the last face.
  if (!id) return "home-moves";
  if (id === "home-game" || id === "clean-sneaks") return "home-game";
  if (id === "home-moves" || id === "the-moves-like") return "home-moves";
  if (id === "home-beta" || id === "beta-apps") return "home-beta";
  if (id === "nav-cube") return "nav-cube";
  // Retired explore face — open The Moves Like homepage instead.
  if (id === "home-explore") return "home-moves";
  // Mixing console lives on the beta face.
  if (HOMEPAGE_BETA_SECTION_HASHES.has(id)) return "home-beta";
  // Deep-linked story / pricing sections live on the combined face.
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
