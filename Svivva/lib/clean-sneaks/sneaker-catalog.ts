/**
 * Sneaker personalities — each pair changes gameplay strategy.
 */

import type { SneakerMaterial } from "./dirt-system";

export type SneakerArchetypeId =
  | "baloon8"
  | "whiteLeather"
  | "suedeRunner"
  | "meshRunner"
  | "luxury"
  | "beatUp"
  | "rareCollectible"
  | "highTop";

export type SneakerArchetype = {
  id: SneakerArchetypeId;
  label: string;
  material: SneakerMaterial;
  /** Style score multiplier when clean */
  styleMul: number;
  /** Extra damage penalty when dirty/creased */
  damagePenalty: number;
  /** Jump / movement agility (1 = baseline) */
  agility: number;
  /** Ankle protection reduces side/heel hits */
  ankleProtection: number;
  /** Reputation / awareness from NPCs */
  reputation: number;
  /** Stress from dirt (beat-up = low) */
  stress: number;
  blurb: string;
};

export const SNEAKER_ARCHETYPES: Record<SneakerArchetypeId, SneakerArchetype> = {
  baloon8: {
    id: "baloon8",
    label: "Baloon8",
    material: "leather",
    styleMul: 1.25,
    damagePenalty: 1.1,
    agility: 1.05,
    ankleProtection: 0.15,
    reputation: 1.2,
    stress: 1.0,
    blurb: "Signature pair. Style when fresh, every mark shows.",
  },
  whiteLeather: {
    id: "whiteLeather",
    label: "White Leather",
    material: "leather",
    styleMul: 1.15,
    damagePenalty: 1.35,
    agility: 1.0,
    ankleProtection: 0.05,
    reputation: 1.0,
    stress: 1.2,
    blurb: "Easy to wipe — but every scuff screams.",
  },
  suedeRunner: {
    id: "suedeRunner",
    label: "Suede Classic",
    material: "suede",
    styleMul: 1.2,
    damagePenalty: 1.5,
    agility: 0.95,
    ankleProtection: 0.1,
    reputation: 1.1,
    stress: 1.4,
    blurb: "Looks soft. Water is the enemy.",
  },
  meshRunner: {
    id: "meshRunner",
    label: "Mesh Runner",
    material: "mesh",
    styleMul: 0.95,
    damagePenalty: 0.85,
    agility: 1.25,
    ankleProtection: 0.05,
    reputation: 0.8,
    stress: 0.7,
    blurb: "Built to move. Dust finds every hole.",
  },
  luxury: {
    id: "luxury",
    label: "Luxury Low",
    material: "patent",
    styleMul: 1.8,
    damagePenalty: 2.0,
    agility: 0.9,
    ankleProtection: 0.0,
    reputation: 1.6,
    stress: 1.8,
    blurb: "Huge style multiplier. Massive penalty for damage.",
  },
  beatUp: {
    id: "beatUp",
    label: "Beat-Up Daily",
    material: "canvas",
    styleMul: 0.6,
    damagePenalty: 0.35,
    agility: 1.05,
    ankleProtection: 0.1,
    reputation: 0.4,
    stress: 0.2,
    blurb: "Low cleanliness bonus. Almost no stress.",
  },
  rareCollectible: {
    id: "rareCollectible",
    label: "Rare Collectible",
    material: "suede",
    styleMul: 2.0,
    damagePenalty: 2.2,
    agility: 0.85,
    ankleProtection: 0.05,
    reputation: 2.0,
    stress: 2.0,
    blurb: "Maximum reputation. Maximum risk.",
  },
  highTop: {
    id: "highTop",
    label: "High-Top",
    material: "leather",
    styleMul: 1.1,
    damagePenalty: 1.0,
    agility: 0.9,
    ankleProtection: 0.45,
    reputation: 1.05,
    stress: 0.9,
    blurb: "Better ankle protection. Heavier steps.",
  },
};

export const DEFAULT_ARCHETYPE: SneakerArchetypeId = "baloon8";

export function getArchetype(id?: SneakerArchetypeId | null): SneakerArchetype {
  return SNEAKER_ARCHETYPES[id ?? DEFAULT_ARCHETYPE] ?? SNEAKER_ARCHETYPES.baloon8;
}
