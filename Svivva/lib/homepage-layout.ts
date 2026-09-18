/** Which below-the-fold homepage sections render. Cube + nav + footer always show. */
export const HOMEPAGE_SECTIONS = {
/** Full-viewport scroll snap: cube → bundle cube → explore. Legacy fallback when cubeJourney is off. */
  scrollSnap: true,
  /** Three-face journey cube: begin → game → home (replaces scroll snap panels). */
  cubeJourney: true,
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
