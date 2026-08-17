import { FEATURE_PUBLIC_PATHS } from "@/lib/feature-routes";

export type FeatureId = "play" | "seeds" | "orbit" | "security" | "api" | "hardware";

export type FeatureDef = {
  id: FeatureId;
  index: number;
  name: string;
  /** Short face label painted on the cube (Play, Seeds, …). */
  shortLabel: string;
  artworkTitle: string;
  artworkSrc: string;
  tagline: string;
  description: string;
  cta: { label: string; href: string };
  accentColor: string;
  motif: string;
  signatureMotion: string;
};

export const FEATURES: FeatureDef[] = [
  {
    id: "play",
    index: 0,
    name: "ZZAI Play",
    shortLabel: "Play",
    artworkTitle: "BREATH AWAY",
    artworkSrc: "/artworks/play.png",
    tagline: "Sampler · stems · neural audio",
    description:
      "ZZAI Play — the music studio face. Hardware sampler UI, stems, patches, and neural audio workflows.",
    cta: { label: "Open ZZAI Play", href: FEATURE_PUBLIC_PATHS.play },
    accentColor: "#90c4d8",
    motif: "waveform",
    signatureMotion: "scan-lines pulse with rhythm",
  },
  {
    id: "seeds",
    index: 1,
    name: "ZZAI Seeds",
    shortLabel: "Seeds",
    artworkTitle: "SETTLE DOWN",
    artworkSrc: "/artworks/seeds.png",
    tagline: "PDF or YouTube → many apps",
    description:
      "ZZAI Seeds — CH 01 on the mixing board. PDF blueprint or YouTube transcript in; full-stack app suites out.",
    cta: { label: "Open Seeds", href: FEATURE_PUBLIC_PATHS.seeds },
    accentColor: "#9085c4",
    motif: "branching",
    signatureMotion: "nodes branch outward from centre",
  },
  {
    id: "orbit",
    index: 2,
    name: "Marketing Orbit",
    shortLabel: "Orbit",
    artworkTitle: "ORBIT / IMG 2007",
    artworkSrc: "/artworks/orbit.png",
    tagline: "Growth intelligence on autopilot",
    description:
      "Marketing Orbit — SEO, indexing, Channel Intel, and traffic automation while you sleep.",
    cta: { label: "Open Marketing Orbit", href: FEATURE_PUBLIC_PATHS.orbit },
    accentColor: "#b85020",
    motif: "web",
    signatureMotion: "web filaments pulse on scroll",
  },
  {
    id: "security",
    index: 3,
    name: "Poor Man Protection",
    shortLabel: "Protect",
    artworkTitle: "FOREVER YOURS",
    artworkSrc: "/artworks/security.png",
    tagline: "Sketch-to-seal group patents",
    description:
      "Poor Man Protection — deposit sketches, mint a protection coin, and build a court-ready pack.",
    cta: { label: "Open Poor Man Protection", href: FEATURE_PUBLIC_PATHS.security },
    accentColor: "#a888bc",
    motif: "seal",
    signatureMotion: "ornamental border traces and locks",
  },
  {
    id: "api",
    index: 4,
    name: "Digital",
    shortLabel: "Digital",
    artworkTitle: "BANG ON ME",
    artworkSrc: "/artworks/api.png",
    tagline: "Signal bus — prompt to API",
    description:
      "Digital — the Signal path. Plain English becomes a production API with schema, evals, and rollback.",
    cta: { label: "Open Digital / API Builder", href: FEATURE_PUBLIC_PATHS.api },
    accentColor: "#6880a0",
    motif: "packaging",
    signatureMotion: "panels fold and assemble",
  },
  {
    id: "hardware",
    index: 5,
    name: "Hardware",
    shortLabel: "Hardware",
    artworkTitle: "DIAMOND FISTS",
    artworkSrc: "/artworks/hardware.png",
    tagline: "Crest bus — schematics to BOM",
    description:
      "Hardware — the Crest path. AI schematics, material sourcing, and manufacturing from concept to part.",
    cta: { label: "Open Hardware Builder", href: FEATURE_PUBLIC_PATHS.hardware },
    accentColor: "#d880b0",
    motif: "crystal",
    signatureMotion: "diamonds rotate and refract light",
  },
];
