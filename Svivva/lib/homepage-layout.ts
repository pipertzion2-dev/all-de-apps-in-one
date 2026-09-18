/** Which below-the-fold homepage sections render. Cube + nav + footer always show. */
export const HOMEPAGE_SECTIONS = {
  /** Full-viewport scroll snap: cube → game → explore (three.js). */
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
  /** Legacy inline quick links (scrollSnap uses explore panel instead). */
  quickLinks: false,
} as const;

export type HomepageSection = keyof typeof HOMEPAGE_SECTIONS;

export function showHomepageSection(section: HomepageSection): boolean {
  return HOMEPAGE_SECTIONS[section];
}
