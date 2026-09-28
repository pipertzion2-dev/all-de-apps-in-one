import { FEATURE_PUBLIC_PATHS } from "@/lib/feature-routes";
import { MEDIA } from "@/lib/media-assets";
import { isBetaCubeFaceId } from "@/lib/product-positioning";

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
  beta?: boolean;
};

function withBeta(f: Omit<FeatureDef, "beta">): FeatureDef {
  return { ...f, beta: isBetaCubeFaceId(f.id) };
}

export const FEATURES: FeatureDef[] = [
  withBeta({
    id: "play",
    index: 0,
    name: "Klean Sneaks",
    shortLabel: "Play",
    artworkTitle: "BREATH AWAY",
    artworkSrc: MEDIA.artworks.play,
    tagline: "Keep the product clean — the public demo",
    description:
      "Klean Sneaks — zone-based shoe state, Sneak Vision hazard preview, and mission saves that mirror production guardrails.",
    cta: { label: "Play Klean Sneaks", href: FEATURE_PUBLIC_PATHS.play },
    accentColor: "#90c4d8",
    motif: "waveform",
    signatureMotion: "scan-lines pulse with rhythm",
  }),
  withBeta({
    id: "seeds",
    index: 1,
    name: "ZZAI Seeds",
    shortLabel: "Seeds",
    artworkTitle: "SETTLE DOWN",
    artworkSrc: MEDIA.artworks.seeds,
    tagline: "PDF or YouTube → many apps",
    description:
      "ZZAI Seeds — CH 01 on the mixing board. PDF blueprint or YouTube transcript in; full-stack app suites out.",
    cta: { label: "Open Seeds", href: FEATURE_PUBLIC_PATHS.seeds },
    accentColor: "#9085c4",
    motif: "branching",
    signatureMotion: "nodes branch outward from centre",
  }),
  withBeta({
    id: "orbit",
    index: 2,
    name: "Marketing Orbit",
    shortLabel: "Orbit",
    artworkTitle: "ORBIT / IMG 2007",
    artworkSrc: MEDIA.artworks.orbit,
    tagline: "Growth intelligence on autopilot",
    description:
      "Marketing Orbit — SEO, indexing, Channel Intel, and traffic automation while you sleep.",
    cta: { label: "Open Marketing Orbit", href: FEATURE_PUBLIC_PATHS.orbit },
    accentColor: "#b85020",
    motif: "web",
    signatureMotion: "web filaments pulse on scroll",
  }),
  withBeta({
    id: "security",
    index: 3,
    name: "Poor Man Protection",
    shortLabel: "Protect",
    artworkTitle: "FOREVER YOURS",
    artworkSrc: MEDIA.artworks.security,
    tagline: "Sketch-to-seal group patents",
    description:
      "Poor Man Protection — deposit sketches, mint a protection coin, and build a court-ready pack.",
    cta: { label: "Open Poor Man Protection", href: FEATURE_PUBLIC_PATHS.security },
    accentColor: "#a888bc",
    motif: "seal",
    signatureMotion: "ornamental border traces and locks",
  }),
  withBeta({
    id: "api",
    index: 4,
    name: "Production guardrails",
    shortLabel: "Digital",
    artworkTitle: "BANG ON ME",
    artworkSrc: MEDIA.artworks.api,
    tagline: "Hazard preview · schema · rollback",
    description:
      "The GA product — preview deploy risks, enforce JSON Schema on every response, and roll back in one click.",
    cta: { label: "Open API Builder", href: FEATURE_PUBLIC_PATHS.api },
    accentColor: "#6880a0",
    motif: "packaging",
    signatureMotion: "panels fold and assemble",
  }),
  withBeta({
    id: "hardware",
    index: 5,
    name: "Hardware",
    shortLabel: "Hardware",
    artworkTitle: "DIAMOND FISTS",
    artworkSrc: MEDIA.artworks.hardware,
    tagline: "Crest bus — schematics to BOM",
    description:
      "Hardware — the Crest path. AI schematics, material sourcing, and manufacturing from concept to part.",
    cta: { label: "Open Hardware Builder", href: FEATURE_PUBLIC_PATHS.hardware },
    accentColor: "#d880b0",
    motif: "crystal",
    signatureMotion: "diamonds rotate and refract light",
  }),
];
