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
};

/** One-job public slices of newer ZZAI channels — not the full product. */
export const FEATURE_MINI_APPS: FeatureMiniApp[] = [
  {
    slug: "event-divvy-preview",
    path: "/tools/event-divvy-preview",
    name: "Event Divvy Preview",
    description:
      "Enter a total cost and guest list to see who gives and who receives. ZZAI ZZAI Show tracks live events with full attendance.",
    hub: "ai-tools-hub",
    parentHref: "/seeds",
    parentLabel: "ZZAI Seeds",
    sliceNote: "One-shot split math — not saved events, check-in, or settlement tracking.",
    keyword: "event cost split calculator",
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
    parentHref: "/dashboard/poor-man-protection",
    parentLabel: "Poor Man Protection",
    sliceNote: "SHA-256 only — not dual-axis hybridization, coin mint, or court PDF.",
    keyword: "sketch file hash",
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
  },
];

export const FEATURE_MINI_APP_SLUGS = FEATURE_MINI_APPS.map((t) => t.slug);

export function getFeatureMiniApp(slug: string): FeatureMiniApp | undefined {
  return FEATURE_MINI_APPS.find((t) => t.slug === slug);
}

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
