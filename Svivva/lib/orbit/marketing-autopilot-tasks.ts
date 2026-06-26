/** Checklist task metadata — IDs match marketing-checklist.tsx */
export type AutopilotTaskDef = {
  id: string;
  label: string;
  group: string;
  credentialKeys?: string[];
  automatable: "full" | "api" | "onsite" | "prepare_only";
};

export const MARKETING_AUTOPILOT_TASKS: AutopilotTaskDef[] = [
  {
    id: "tech-indexnow-key",
    label: "IndexNow key",
    group: "Technical Foundation",
    automatable: "onsite",
  },
  {
    id: "tech-indexnow-submitted",
    label: "IndexNow submitted",
    group: "Technical Foundation",
    automatable: "onsite",
  },
  {
    id: "tech-sitemap",
    label: "Sitemap live",
    group: "Technical Foundation",
    automatable: "onsite",
  },
  {
    id: "tech-gsc-sitemap",
    label: "GSC sitemap API",
    group: "Technical Foundation",
    credentialKeys: ["googleServiceAccount"],
    automatable: "onsite",
  },
  {
    id: "tech-schema-jsonld",
    label: "Schema.org JSON-LD",
    group: "Technical Foundation",
    automatable: "onsite",
  },
  {
    id: "tech-rich-results",
    label: "Rich results test",
    group: "Technical Foundation",
    automatable: "prepare_only",
  },
  {
    id: "content-seo-pages",
    label: "SEO landing pages",
    group: "AI Content",
    automatable: "onsite",
  },
  {
    id: "content-comparisons",
    label: "Comparison pages",
    group: "AI Content",
    automatable: "onsite",
  },
  { id: "content-blog", label: "Blog posts", group: "AI Content", automatable: "onsite" },
  { id: "content-aeo", label: "AEO pages", group: "AI Content", automatable: "onsite" },
  {
    id: "content-integrations",
    label: "Integration pages",
    group: "AI Content",
    automatable: "onsite",
  },
  { id: "content-usecases", label: "Use-case pages", group: "AI Content", automatable: "onsite" },
  {
    id: "content-templates",
    label: "API template pages",
    group: "AI Content",
    automatable: "onsite",
  },
  { id: "content-paa", label: "PAA pages", group: "AI Content", automatable: "onsite" },
  {
    id: "content-parasite",
    label: "Parasite articles generated",
    group: "AI Content",
    automatable: "full",
  },
  {
    id: "content-social-pack",
    label: "Social launch pack",
    group: "AI Content",
    automatable: "full",
  },
  { id: "content-community", label: "Community posts", group: "AI Content", automatable: "full" },
  { id: "content-outreach", label: "Outreach pitches", group: "AI Content", automatable: "full" },
  {
    id: "manual-devto",
    label: "Publish on Dev.to",
    group: "Manual Publishing",
    credentialKeys: ["devtoApiKey"],
    automatable: "api",
  },
  {
    id: "manual-hashnode",
    label: "Publish on Hashnode",
    group: "Manual Publishing",
    credentialKeys: ["hashnodeApiKey", "hashnodePublicationId"],
    automatable: "api",
  },
  {
    id: "manual-medium",
    label: "Publish on Medium",
    group: "Manual Publishing",
    automatable: "prepare_only",
  },
  {
    id: "manual-reddit-sideproject",
    label: "Reddit r/SideProject",
    group: "Manual Publishing",
    credentialKeys: ["redditClientId", "redditClientSecret", "redditRefreshToken"],
    automatable: "api",
  },
  {
    id: "manual-showhn",
    label: "Show HN",
    group: "Manual Publishing",
    automatable: "prepare_only",
  },
  {
    id: "manual-producthunt",
    label: "Product Hunt launch",
    group: "Manual Publishing",
    automatable: "prepare_only",
  },
  {
    id: "manual-twitter-thread",
    label: "Twitter/X thread",
    group: "Manual Publishing",
    credentialKeys: [
      "twitterApiKey",
      "twitterApiSecret",
      "twitterAccessToken",
      "twitterAccessSecret",
      "omnisocialsApiKey",
    ],
    automatable: "api",
  },
  {
    id: "manual-linkedin",
    label: "LinkedIn post",
    group: "Manual Publishing",
    credentialKeys: ["omnisocialsApiKey"],
    automatable: "api",
  },
  {
    id: "manual-indiehackers",
    label: "Indie Hackers post",
    group: "Manual Publishing",
    automatable: "prepare_only",
  },
  {
    id: "manual-newsletters",
    label: "Newsletter pitches",
    group: "Manual Publishing",
    credentialKeys: ["resendApiKey", "outreachFromEmail", "newsletterPitchEmail"],
    automatable: "api",
  },
  {
    id: "manual-podcasts",
    label: "Podcast pitches",
    group: "Manual Publishing",
    credentialKeys: ["resendApiKey", "outreachFromEmail", "podcastPitchEmail"],
    automatable: "api",
  },
  {
    id: "manual-gsc-indexing",
    label: "Google URL indexing",
    group: "Technical Foundation",
    automatable: "onsite",
  },
  {
    id: "dir-futurepedia",
    label: "Futurepedia listing",
    group: "Directories",
    automatable: "prepare_only",
  },
  { id: "dir-taaft", label: "TAAFT listing", group: "Directories", automatable: "prepare_only" },
  { id: "dir-g2", label: "G2 listing", group: "Directories", automatable: "prepare_only" },
  {
    id: "dir-alternativeto",
    label: "AlternativeTo",
    group: "Directories",
    automatable: "prepare_only",
  },
  { id: "dir-crunchbase", label: "Crunchbase", group: "Directories", automatable: "prepare_only" },
  {
    id: "dir-growth-engine-overall",
    label: "Growth Engine directories",
    group: "Directories",
    automatable: "prepare_only",
  },
  {
    id: "auto-sitemap-pings",
    label: "Weekly sitemap pings",
    group: "Recurring",
    automatable: "onsite",
  },
  {
    id: "auto-growth-tasks",
    label: "Growth Engine cron",
    group: "Recurring",
    automatable: "onsite",
  },
  {
    id: "auto-content-velocity",
    label: "Content velocity",
    group: "Recurring",
    automatable: "onsite",
  },
];

export function taskDefById(id: string): AutopilotTaskDef | undefined {
  return MARKETING_AUTOPILOT_TASKS.find((t) => t.id === id);
}
