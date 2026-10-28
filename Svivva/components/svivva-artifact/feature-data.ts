import { MEDIA } from "@/lib/media-assets";
export type FeatureId = "play" | "seeds" | "orbit" | "security" | "api" | "hardware";

export type ArtworkFeature = {
  id: FeatureId;
  artwork: string;
  artworkAlt: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  cta: string;
  accentColor: string;
  accentColorRgb: string;
  /** dominant visual elements extracted from artwork */
  motifs: string[];
  /** signature scroll interaction */
  signature: string;
};

export const ARTIFACT_FEATURES: ArtworkFeature[] = [
  {
    id: "play",
    artwork: MEDIA.artworks.play,
    artworkAlt: "BREATH_AWAY — Game",
    title: "Game",
    subtitle: "Car-sneaker runner — unlock color finishes",
    description:
      "Free game — keep a car-sneaker clean, unlock finishes, peek ahead for hazards, and use quick saves.",
    href: "/clean-sneaks",
    cta: "Open Game",
    accentColor: "#90c4d8",
    accentColorRgb: "144,196,216",
    motifs: ["scan lines", "waveforms", "motion streaks", "neon grid"],
    signature: "Scan lines pulse on scroll like audio waveforms",
  },
  {
    id: "seeds",
    artwork: MEDIA.artworks.seeds,
    artworkAlt: "Settle Down — ZZAI Seeds",
    title: "Seeds — brief to apps",
    subtitle: "Turn one brief into many apps",
    description:
      "One structured brief generates an entire product suite — frontend, backend, database, auth, and deploy configs, all built together.",
    href: "/seeds",
    cta: "Turn a brief into apps",
    accentColor: "#5a8c7a",
    accentColorRgb: "90,140,122",
    motifs: ["music staff", "four panels", "togetherness", "parallel structure"],
    signature: "Music staff lines expand into branching app nodes on scroll",
  },
  {
    id: "orbit",
    artwork: MEDIA.artworks.orbit,
    artworkAlt: "IMG_2007 — Seeds Marketing Engine",
    title: "SEO & growth",
    subtitle: "Search traffic on autopilot",
    description:
      "SEO helpers, competitor checks, indexing, and social publishing that keep working while you sleep.",
    href: "/dashboard/launchpad",
    cta: "Open SEO & growth",
    accentColor: "#8ca840",
    accentColorRgb: "140,168,64",
    motifs: ["fractured eyes", "botanical web", "copper network", "observation"],
    signature: "Web lines pulse outward from center on hover",
  },
  {
    id: "security",
    artwork: MEDIA.artworks.security,
    artworkAlt: "ROMEO_3 — Security",
    title: "Poor Man Protection",
    subtitle: "Sketch-to-seal evidence packs",
    description:
      "Upload sketches, seal them, and download proof you can share — not a government patent.",
    href: "/poor-man-protection",
    cta: "Open Protect",
    accentColor: "#4a9cac",
    accentColorRgb: "74,156,172",
    motifs: ["ornate border", "layered stripes", "crystal vessels", "lock"],
    signature: "Filigree border locks into place on scroll",
  },
  {
    id: "api",
    artwork: MEDIA.artworks.apiBuilder,
    artworkAlt: "Bang On Me — AI API Builder",
    title: "Digital",
    subtitle: "Signal bus — prompt to API",
    description:
      "Write the prompt. Deploy the API. Schema enforcement, 200 auto-written evals, version control, and instant rollback — zero ops.",
    href: "/dashboard/api-builder",
    cta: "Start Building",
    accentColor: "#a87080",
    accentColorRgb: "168,112,128",
    motifs: ["jewel case panels", "shrink wrap", "fragmented structure", "packaging"],
    signature: "Packaging panels assemble on scroll like schema validation",
  },
  {
    id: "hardware",
    artwork: MEDIA.artworks.hardware,
    artworkAlt: "PETALS_3 — Hardware Mode",
    title: "Hardware",
    subtitle: "Real things, real hands",
    description:
      "AI-powered schematics, material sourcing, supplier network, and dimensional previews for physical product manufacturing.",
    href: "/dashboard/hardware-builder",
    cta: "Start Manufacturing",
    accentColor: "#d070c0",
    accentColorRgb: "208,112,192",
    motifs: ["diamond fists", "figurines", "gems", "weight", "physicality"],
    signature: "Diamonds refract and rotate as you scroll",
  },
];
