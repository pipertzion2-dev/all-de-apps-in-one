/** Which below-the-fold homepage sections render. Cube + nav + footer always show. */
export const HOMEPAGE_SECTIONS = {
  /** Full-viewport Dune-style cube flip: game → product cube homepage (with pricing). */
  scrollSnap: true,
  oaasIntro: false,
  eventTracker: false,
  /** Legacy non-scrollSnap path only — OaaS mounts in HomepageCubePanel when scrollSnap is on. */
  oaasHub: false,
  buildSystem: false,
  tractionBar: false,
  features: false,
  /** Legacy path only — scrollSnap uses HomepageFounderSonSection before pricing. */
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

/**
 * Fixed homepage nav (`home-page-client`) — flip-stack scroll layer must start below this
 * (includes safe-area inset on the nav bar).
 */
export const HOMEPAGE_MAIN_NAV_OFFSET =
  "calc(3.5rem + env(safe-area-inset-top, 0px))" as const;
export const HOMEPAGE_MAIN_NAV_OFFSET_SM =
  "calc(4rem + env(safe-area-inset-top, 0px))" as const;
