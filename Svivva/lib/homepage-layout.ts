/** Which below-the-fold homepage sections render.
 * Product cube path (`scrollSnap`) owns about + pricing inside HomepageCubePanel.
 * Remaining flags stay off — legacy marketing blocks were removed from the page. */
export const HOMEPAGE_SECTIONS = {
  /** Full-viewport Dune-style cube flip: game → product cube homepage (with pricing). */
  scrollSnap: true,
  oaasIntro: false,
  eventTracker: false,
  oaasHub: false,
  buildSystem: false,
  tractionBar: false,
  features: false,
  founderStory: false,
  howItWorks: false,
  evaluation: false,
  pricing: false,
  finalCta: false,
  cleanSneaks: false,
  /** Legacy inline quick links below the hero when scrollSnap is off. */
  quickLinks: false,
} as const;

export type HomepageSection = keyof typeof HOMEPAGE_SECTIONS;

export function showHomepageSection(section: HomepageSection): boolean {
  return HOMEPAGE_SECTIONS[section];
}
