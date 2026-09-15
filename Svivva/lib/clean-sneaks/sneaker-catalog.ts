/**
 * BALOON8 is the only sneaker in Clean Sneaks.
 * Unlockable options are colorways of the same car-sneaker — never other silhouettes.
 */

import type { SneakerMaterial } from "./dirt-system";

export type Baloon8ColorwayId =
  | "oilSlick"
  | "emerald"
  | "amethyst"
  | "abalone"
  | "graphite"
  | "midnight"
  | "void"
  | "solar";

/** @deprecated Use Baloon8ColorwayId — kept so old saves / props still resolve. */
export type SneakerArchetypeId = Baloon8ColorwayId;

export type Baloon8Colorway = {
  id: Baloon8ColorwayId;
  label: string;
  /** Short UI chip */
  shortLabel: string;
  /** Balloon pod hex palette (iridescent shifts) */
  pods: number[];
  /** Hull / shadow base */
  hull: number;
  /** Front grille / plate glow */
  accent: number;
  /** CSS swatch for picker */
  swatch: string;
  /** Orthographic tint multiply (runner HUD / panels) */
  tint: string;
  /** Reference sheet under /assets/clean-sneaks/baloon8-variants/ */
  referenceUrl: string;
  material: SneakerMaterial;
  styleMul: number;
  damagePenalty: number;
  agility: number;
  ankleProtection: number;
  reputation: number;
  stress: number;
  blurb: string;
};

/** Shared BALOON8 chassis stats — colorways only change look (+ tiny finish bias). */
const CHASSIS = {
  material: "patent" as SneakerMaterial,
  styleMul: 1.35,
  damagePenalty: 1.25,
  agility: 1.05,
  ankleProtection: 0.12,
  reputation: 1.4,
  stress: 1.15,
};

export const BALOON8_COLORWAYS: Record<Baloon8ColorwayId, Baloon8Colorway> = {
  oilSlick: {
    id: "oilSlick",
    label: "BALOON8 Oil Slick",
    shortLabel: "Oil Slick",
    pods: [
      0x0e2a32, 0x164848, 0x1a6068, 0x0e3850, 0x2a4878, 0x1a7058, 0x3a3888, 0x228878, 0x4a58a0,
      0x2ab898, 0x185868, 0x5a3060, 0x8a5040,
    ],
    hull: 0x0a1018,
    accent: 0xb84dff,
    swatch: "linear-gradient(135deg,#1a7058,#3a3888,#8a5040)",
    tint: "#7ec8b8",
    referenceUrl: "/assets/clean-sneaks/baloon8-variants/oil-slick.jpg",
    ...CHASSIS,
    blurb: "Signature oil-slick balloons. The only chassis — this finish.",
  },
  emerald: {
    id: "emerald",
    label: "BALOON8 Emerald",
    shortLabel: "Emerald",
    pods: [
      0x0a2820, 0x0e4030, 0x146048, 0x1a7858, 0x0c3838, 0x188868, 0x0a5040, 0x2aa878, 0x0e6860,
      0x34c090, 0x1a5850, 0x0c4038,
    ],
    hull: 0x061410,
    accent: 0x28e868,
    swatch: "linear-gradient(135deg,#0e4030,#28e868,#146048)",
    tint: "#4ad89a",
    referenceUrl: "/assets/clean-sneaks/baloon8-variants/emerald.jpg",
    ...CHASSIS,
    styleMul: 1.4,
    blurb: "Teal-emerald balloons. Same BALOON8. Fresh green grille.",
  },
  amethyst: {
    id: "amethyst",
    label: "BALOON8 Amethyst",
    shortLabel: "Amethyst",
    pods: [
      0x1a1030, 0x2a1848, 0x3a2068, 0x4a2888, 0x281850, 0x5a30a0, 0x3a2860, 0x6a48b8, 0x482878,
      0x7a58d0, 0x382060, 0x201438,
    ],
    hull: 0x0c0818,
    accent: 0xd94fff,
    swatch: "linear-gradient(135deg,#2a1848,#d94fff,#4a2888)",
    tint: "#c48cff",
    referenceUrl: "/assets/clean-sneaks/baloon8-variants/amethyst.jpg",
    ...CHASSIS,
    reputation: 1.5,
    blurb: "Deep violet balloons. Same slip-on car. Neon purple glow.",
  },
  abalone: {
    id: "abalone",
    label: "BALOON8 Abalone",
    shortLabel: "Abalone",
    pods: [
      0x142830, 0x1a4840, 0x285868, 0x3a4878, 0x1a3850, 0x4a6878, 0x2a5058, 0x5a7888, 0x386070,
      0x6a8898, 0x284850, 0x483858,
    ],
    hull: 0x0a1218,
    accent: 0xff4d6a,
    swatch: "linear-gradient(135deg,#1a4840,#5a7888,#ff4d6a)",
    tint: "#9ab8c8",
    referenceUrl: "/assets/clean-sneaks/baloon8-variants/abalone.jpg",
    ...CHASSIS,
    blurb: "Shell-shift teal / violet. Same BALOON8 body.",
  },
  graphite: {
    id: "graphite",
    label: "BALOON8 Graphite",
    shortLabel: "Graphite",
    pods: [
      0x1a1c20, 0x2a2c30, 0x3a3c40, 0x4a4c50, 0x222428, 0x5a5c60, 0x323438, 0x6a6c70, 0x424448,
      0x7a7c80, 0x2a2c30, 0x181a1e,
    ],
    hull: 0x08090c,
    accent: 0xc8d0d8,
    swatch: "linear-gradient(135deg,#2a2c30,#7a7c80,#c8d0d8)",
    tint: "#a8b0b8",
    referenceUrl: "/assets/clean-sneaks/baloon8-variants/graphite.jpg",
    ...CHASSIS,
    damagePenalty: 1.15,
    stress: 1.0,
    blurb: "Space-gray balloons. Chrome accents. Same chassis.",
  },
  midnight: {
    id: "midnight",
    label: "BALOON8 Midnight",
    shortLabel: "Midnight",
    pods: [
      0x0a1018, 0x121820, 0x1a2030, 0x222840, 0x0e1420, 0x2a3050, 0x181e28, 0x384060, 0x202838,
      0x485070, 0x141820, 0x0c1018,
    ],
    hull: 0x040608,
    accent: 0x28c878,
    swatch: "linear-gradient(135deg,#0a1018,#384060,#28c878)",
    tint: "#687888",
    referenceUrl: "/assets/clean-sneaks/baloon8-variants/midnight.jpg",
    ...CHASSIS,
    blurb: "Near-black balloons. Forest grille. Same BALOON8.",
  },
  void: {
    id: "void",
    label: "BALOON8 Void",
    shortLabel: "Void",
    pods: [
      0x080a10, 0x101218, 0x181a22, 0x202430, 0x0c0e14, 0x282c38, 0x14161c, 0x303440, 0x1c1e28,
      0x383c48, 0x101218, 0x06080c,
    ],
    hull: 0x020304,
    accent: 0x3dff9a,
    swatch: "linear-gradient(135deg,#080a10,#303440,#3dff9a)",
    tint: "#585e68",
    referenceUrl: "/assets/clean-sneaks/baloon8-variants/void.jpg",
    ...CHASSIS,
    styleMul: 1.45,
    reputation: 1.55,
    blurb: "Deepest charcoal pods. Neon green plate. Same car-sneaker.",
  },
  solar: {
    id: "solar",
    label: "BALOON8 Solar",
    shortLabel: "Solar",
    pods: [
      0x2a1808, 0x3a2810, 0x4a3818, 0x5a4820, 0x302010, 0x6a5828, 0x403018, 0x8a6830, 0x504020,
      0xaa8838, 0x382818, 0x201408,
    ],
    hull: 0x120a04,
    accent: 0xff8a20,
    swatch: "linear-gradient(135deg,#3a2810,#aa8838,#ff8a20)",
    tint: "#d4a060",
    referenceUrl: "/assets/clean-sneaks/baloon8-variants/solar.jpg",
    ...CHASSIS,
    styleMul: 1.5,
    damagePenalty: 1.35,
    blurb: "Bronze-gold balloons. Warm grille. Still 100% BALOON8.",
  },
};

export const DEFAULT_COLORWAY: Baloon8ColorwayId = "oilSlick";
export const DEFAULT_ARCHETYPE: Baloon8ColorwayId = DEFAULT_COLORWAY;

/** Legacy id aliases from older builds → BALOON8 colorways. */
const LEGACY_MAP: Record<string, Baloon8ColorwayId> = {
  baloon8: "oilSlick",
  whiteLeather: "graphite",
  suedeRunner: "abalone",
  meshRunner: "emerald",
  luxury: "solar",
  beatUp: "midnight",
  rareCollectible: "void",
  highTop: "amethyst",
};

export function resolveColorwayId(id?: string | null): Baloon8ColorwayId {
  if (!id) return DEFAULT_COLORWAY;
  if (id in BALOON8_COLORWAYS) return id as Baloon8ColorwayId;
  return LEGACY_MAP[id] ?? DEFAULT_COLORWAY;
}

export function getColorway(id?: string | null): Baloon8Colorway {
  return BALOON8_COLORWAYS[resolveColorwayId(id)];
}

/** @deprecated Prefer getColorway */
export function getArchetype(id?: string | null): Baloon8Colorway {
  return getColorway(id);
}

/** @deprecated Prefer BALOON8_COLORWAYS */
export const SNEAKER_ARCHETYPES = BALOON8_COLORWAYS;

export const ALL_COLORWAY_IDS = Object.keys(BALOON8_COLORWAYS) as Baloon8ColorwayId[];

export const COLORWAY_STORAGE_KEY = "zzai.clean-sneaks.baloon8Colorway";

export function readSavedColorway(): Baloon8ColorwayId {
  if (typeof window === "undefined") return DEFAULT_COLORWAY;
  try {
    return resolveColorwayId(window.localStorage.getItem(COLORWAY_STORAGE_KEY));
  } catch {
    return DEFAULT_COLORWAY;
  }
}

export function writeSavedColorway(id: Baloon8ColorwayId): void {
  try {
    window.localStorage.setItem(COLORWAY_STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
