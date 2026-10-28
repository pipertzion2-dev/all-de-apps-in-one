/** Mini-app metadata without UI/image imports — safe for CLI scripts (seo-audit, sitemap). */

export type FeatureMiniApp = {
  slug: string;
  path: string;
  name: string;
  description: string;
  hub: "ai-tools-hub" | "cyber-security-mini-apps" | "seo-pack";
  parentHref: string;
  parentLabel: string;
  sliceNote: string;
  keyword: string;
  /**
   * Mixing-board / PLATFORM_FEATURES id this slice teases.
   * Cube-only navigators may omit this.
   */
  platformFeatureId?: string;
};

/** One-job public slices of ZZAI channels — not the full product. */
export const FEATURE_MINI_APPS: FeatureMiniApp[] = [
  {
    slug: "event-divvy-preview",
    path: "/tools/event-divvy-preview",
    name: "Event Divvy Preview",
    description:
      "Enter a total cost and guest list to see who gives and who receives. ZZAI ZZAI Show tracks live events with full attendance.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/zzai-show",
    parentLabel: "ZZAI ZZAI Show",
    sliceNote: "One-shot split math — not saved events, check-in, or settlement tracking.",
    keyword: "event cost split calculator",
    platformFeatureId: "zzai-show",
  },
  {
    slug: "youtube-caption-preview",
    path: "/tools/youtube-caption-preview",
    name: "YouTube Caption Preview",
    description:
      "Paste a YouTube URL and read public captions. ZZAI Seeds turns those captions into deployable apps.",
    hub: "ai-tools-hub",
    parentHref: "/seeds",
    parentLabel: "ZZAI Seeds",
    sliceNote: "Captions only — not the full Seeds parse, build, or deploy factory.",
    keyword: "youtube caption extractor",
    platformFeatureId: "seeds",
  },
  {
    slug: "channel-blend-preview",
    path: "/tools/channel-blend-preview",
    name: "Channel Blend Preview",
    description:
      "Pick two ZZAI channels and see a first-order hybrid sketch. Hybrid² Lab lists blends and fuses those blends.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/hybrid-lab",
    parentLabel: "Hybrid² Lab",
    sliceNote: "One pairwise sketch — not the marketplace or hybridization to the 2nd power.",
    keyword: "feature blend preview",
    platformFeatureId: "hybridization",
  },
  {
    slug: "oaas-patch-preview",
    path: "/tools/oaas-patch-preview",
    name: "OaaS Patch Preview",
    description:
      "Describe a goal and get a mixing-board patch order. Orchestration as a Service is the full desk.",
    hub: "ai-tools-hub",
    parentHref: "/#oaas",
    parentLabel: "Orchestration as a Service",
    sliceNote: "Keyword patch route only — not the live mixing-board hub.",
    keyword: "oaas patch preview",
    platformFeatureId: "orchestration",
  },
  {
    slug: "zzai-face-chooser",
    path: "/tools/zzai-face-chooser",
    name: "ZZAI Face Chooser",
    description:
      "Answer one job and open the matching cube face. The homepage cube is the six-face navigator.",
    hub: "ai-tools-hub",
    parentHref: "/#nav-cube",
    parentLabel: "ZZAI cube",
    sliceNote: "A chooser — not the 3D cube or the full product on that face.",
    keyword: "zzai cube face finder",
  },
  {
    slug: "cube-walkthrough-pack",
    path: "/tools/cube-walkthrough-pack",
    name: "Cube Walkthrough Pack",
    description:
      "Download a ZIP pack — JSON, markdown, CSV checklist, and six step files — to ship one product through every cube face.",
    hub: "ai-tools-hub",
    parentHref: "/#nav-cube",
    parentLabel: "ZZAI cube",
    sliceNote: "Offline pack download — not the live 3D cube or in-app walkthrough.",
    keyword: "zzai cube walkthrough download",
  },
  {
    slug: "sketch-hash-stamp",
    path: "/tools/sketch-hash-stamp",
    name: "Sketch Hash Stamp",
    description:
      "Hash a sketch in the browser. Poor Man Protection seals, timestamps, and builds a court pack.",
    hub: "cyber-security-mini-apps",
    parentHref: "/poor-man-protection",
    parentLabel: "Poor Man Protection",
    sliceNote: "SHA-256 only — not dual-axis hybridization, coin mint, or court PDF.",
    keyword: "sketch file hash",
    platformFeatureId: "poor-man-protection",
  },
  {
    slug: "klean-score-estimator",
    path: "/tools/klean-score-estimator",
    name: "Klean Score Estimator",
    description:
      "Estimate a Klean Sneaks run score from distance, cleanliness, and streak. The 3D Vegas runner is the full game.",
    hub: "ai-tools-hub",
    parentHref: "/clean-sneaks",
    parentLabel: "Klean Sneaks",
    sliceNote: "Ballpark math only — not 3D gameplay, Oh No saves, or Steal the Bundle.",
    keyword: "sneaker runner score calculator",
    platformFeatureId: "play",
  },
  {
    slug: "bundle-unlock-checker",
    path: "/tools/bundle-unlock-checker",
    name: "Bundle Unlock Checker",
    description:
      "See whether a run score and distance would unlock Steal the Bundle in Klean Sneaks.",
    hub: "ai-tools-hub",
    parentHref: "/clean-sneaks",
    parentLabel: "Klean Sneaks",
    sliceNote: "Rules preview only — not the card game or saved unlock state on your device.",
    keyword: "klean sneaks bundle unlock",
    platformFeatureId: "play",
  },
  {
    slug: "homepage-flip-guide",
    path: "/tools/homepage-flip-guide",
    name: "Homepage Flip Guide",
    description:
      "Preview the two-face homepage: game first, flip to about and pricing. The live site has the full 3D stack.",
    hub: "ai-tools-hub",
    parentHref: "/#clean-sneaks",
    parentLabel: "ZZAI homepage",
    sliceNote: "Static flip demo and scroll tips — not the production WebGL flip stack.",
    keyword: "interactive homepage flip preview",
  },
  {
    slug: "bpm-tap-tempo",
    path: "/tools/bpm-tap-tempo",
    name: "BPM Tap Tempo",
    description: "Tap along to measure BPM. ZZAI Play is the full sampler studio and stem workflow.",
    hub: "ai-tools-hub",
    parentHref: "/play",
    parentLabel: "ZZAI Play",
    sliceNote: "Tap tempo only — not stems, patches, Melodyne export, or the hardware UI.",
    keyword: "bpm tap tempo tool",
    platformFeatureId: "play",
  },
  {
    slug: "sneaker-clean-label",
    path: "/tools/sneaker-clean-label",
    name: "Sneaker Clean Label",
    description:
      "Turn a cleanliness percentage into the same label the Klean Sneaks HUD uses (Fresh, Grimey, Cooked, etc.).",
    hub: "ai-tools-hub",
    parentHref: "/clean-sneaks",
    parentLabel: "Klean Sneaks",
    sliceNote: "Label lookup only — not shoe-zone dirt, 3D splats, or run scoring.",
    keyword: "sneaker cleanliness rating",
    platformFeatureId: "play",
  },
  {
    slug: "orbit-index-readiness",
    path: "/tools/orbit-index-readiness",
    name: "Orbit Index Readiness",
    description:
      "Paste canonical URLs and get a quick IndexNow / Search Console readiness checklist. Marketing Orbit runs full indexing autopilot.",
    hub: "seo-pack",
    parentHref: "/orbit",
    parentLabel: "Marketing Orbit",
    sliceNote: "Checklist only — not GSC OAuth, IndexNow batches, or content generation.",
    keyword: "google search console url checklist",
    platformFeatureId: "orbit",
  },
  {
    slug: "hardware-bom-line-estimator",
    path: "/tools/hardware-bom-line-estimator",
    name: "Hardware BOM Line Estimator",
    description:
      "Estimate a single bill-of-materials line from quantity and unit cost. Hardware Builder builds full schematics and sourcing.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/hardware-builder",
    parentLabel: "Hardware Builder",
    sliceNote: "One BOM line — not schematics, suppliers, or manufacturing export.",
    keyword: "bom cost estimator",
    platformFeatureId: "hardware-builder",
  },
  {
    slug: "api-endpoint-sketch",
    path: "/tools/api-endpoint-sketch",
    name: "API Endpoint Sketch",
    description:
      "Turn a plain-English job into a suggested method and path. API Builder deploys fused endpoints with schema guards.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/api-builder",
    parentLabel: "API Builder",
    sliceNote: "Path sketch only — not deploy, JSON Schema enforcement, or rollback.",
    keyword: "api endpoint path generator",
    platformFeatureId: "api-builder",
  },
  {
    slug: "idea-gap-scorer",
    path: "/tools/idea-gap-scorer",
    name: "Idea Gap Scorer",
    description:
      "Score a product idea on problem, audience, and differentiation. Idea Engine runs full market-gap research.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/idea-engine",
    parentLabel: "Idea Engine",
    sliceNote: "Heuristic score only — not competitor crawl or opportunity database.",
    keyword: "startup idea score calculator",
    platformFeatureId: "idea-engine",
  },
  {
    slug: "launch-headline-tester",
    path: "/tools/launch-headline-tester",
    name: "Launch Headline Tester",
    description:
      "Check headline length and clarity before you ship a landing page. Launch Studio builds full launch assets.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/launch-studio",
    parentLabel: "Launch Studio",
    sliceNote: "Headline rubric only — not landing generation or social packs.",
    keyword: "landing page headline checker",
    platformFeatureId: "launch-studio",
  },
  {
    slug: "utm-campaign-builder",
    path: "/tools/utm-campaign-builder",
    name: "UTM Campaign Builder",
    description:
      "Build a tagged campaign URL with source, medium, and campaign. Marketing Console automates SEO and GSC growth.",
    hub: "seo-pack",
    parentHref: "/dashboard/marketing",
    parentLabel: "Marketing Console",
    sliceNote: "One UTM link — not GSC connect, funnels, or autopilot.",
    keyword: "utm link builder",
    platformFeatureId: "marketing",
  },
  {
    slug: "channel-intel-keyword-scan",
    path: "/tools/channel-intel-keyword-scan",
    name: "Channel Intel Keyword Scan",
    description:
      "Paste a transcript snippet and extract repeated keywords. Channel Intel watches YouTube and feeds the Grow bus.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/marketing/channel-intel",
    parentLabel: "Channel Intel",
    sliceNote: "Local keyword frequency — not live YouTube watch or tactic packs.",
    keyword: "youtube transcript keyword extractor",
    platformFeatureId: "channel-intel",
  },
  {
    slug: "project-eval-checklist",
    path: "/tools/project-eval-checklist",
    name: "Project Eval Checklist",
    description:
      "Tick a short prompt-version and eval readiness list. Projects keeps versioned prompts with one-click rollback.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/projects",
    parentLabel: "Projects",
    sliceNote: "Checklist only — not version history, auto-evals, or rollback.",
    keyword: "prompt evaluation checklist",
    platformFeatureId: "projects",
  },
  {
    slug: "hypothesis-pair-sketch",
    path: "/tools/hypothesis-pair-sketch",
    name: "Hypothesis Pair Sketch",
    description:
      "Name two components and see a Crest-style hybrid hypothesis line. Hypothesis Lab explores cross-ecosystem innovation.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/hypothesis-hardware",
    parentLabel: "Hypothesis Lab (Hardware)",
    sliceNote: "One pair sketch — not component graph search or lab runs.",
    keyword: "hardware hypothesis generator",
    platformFeatureId: "hypothesis-hardware",
  },
  {
    slug: "security-posture-quiz",
    path: "/tools/security-posture-quiz",
    name: "Security Posture Quiz",
    description:
      "Answer five yes/no questions for a quick cyber posture score. Security / Clutety runs threat sim and PQC tooling.",
    hub: "cyber-security-mini-apps",
    parentHref: "/dashboard/security",
    parentLabel: "Security / Clutety",
    sliceNote: "Self-report quiz only — not scanners, PQC, or live threat simulation.",
    keyword: "website security posture quiz",
    platformFeatureId: "security",
  },
  {
    slug: "pulse-conversion-snapshot",
    path: "/tools/pulse-conversion-snapshot",
    name: "Pulse Conversion Snapshot",
    description:
      "Enter visits and conversions for a one-line rate. Pulse is the live VU meter across APIs and launches.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/pulse",
    parentLabel: "Pulse",
    sliceNote: "Offline math only — not live analytics or API monitoring.",
    keyword: "conversion rate calculator",
    platformFeatureId: "pulse",
  },
  {
    slug: "edu-advocacy-next-step",
    path: "/tools/edu-advocacy-next-step",
    name: "Edu Advocacy Next Step",
    description:
      "Pick a school situation and get the next advocacy step on the Advocate bus. Education Advocacy Console runs the full workflow.",
    hub: "ai-tools-hub",
    parentHref: "/dashboard/education-advocacy",
    parentLabel: "Education Advocacy Console",
    sliceNote: "Routing hint only — not legal advice, vault seals, or crisis case files.",
    keyword: "student advocacy next steps",
    platformFeatureId: "education-advocacy",
  },
];

export const FEATURE_MINI_APP_SLUGS = FEATURE_MINI_APPS.map((t) => t.slug);

export function getFeatureMiniApp(slug: string): FeatureMiniApp | undefined {
  return FEATURE_MINI_APPS.find((t) => t.slug === slug);
}

/** Main mixing-board channels that must ship at least one indexable /tools mini. */
export const MAIN_PLATFORM_FEATURE_IDS = [
  "orchestration",
  "seeds",
  "api-builder",
  "projects",
  "hybridization",
  "poor-man-protection",
  "idea-engine",
  "launch-studio",
  "marketing",
  "channel-intel",
  "orbit",
  "play",
  "hardware-builder",
  "hypothesis-hardware",
  "security",
  "pulse",
  "education-advocacy",
  "zzai-show",
] as const;

export type MainPlatformFeatureId = (typeof MAIN_PLATFORM_FEATURE_IDS)[number];

/** Public channels for the free H¹ sketch — not the Hybrid² marketplace. */
export const BLEND_PREVIEW_CHANNELS: { id: string; label: string }[] = [
  { id: "seeds", label: "CH 01 Seeds" },
  { id: "api-builder", label: "CH 02 APIaaS" },
  { id: "play", label: "CH 15 Play" },
  { id: "hardware-builder", label: "CH 05 Hardware" },
  { id: "poor-man-protection", label: "CH 13 Protect" },
  { id: "hybridization", label: "CH 06 Hybrid FX" },
  { id: "zzai-show", label: "CH 25 Show" },
];
