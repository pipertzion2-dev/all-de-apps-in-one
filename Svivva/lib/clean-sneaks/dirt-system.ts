/**
 * Clean Sneaks dirt-zone system.
 * Each shoe is divided into zones; substances land where contact happens.
 */

export const DIRT_ZONES = [
  "toeBox",
  "leftSide",
  "rightSide",
  "heel",
  "tongue",
  "laces",
  "midsole",
  "outsole",
] as const;

export type DirtZone = (typeof DIRT_ZONES)[number];

export const ZONE_LABELS: Record<DirtZone, string> = {
  toeBox: "Toe Box",
  leftSide: "Left Side",
  rightSide: "Right Side",
  heel: "Heel",
  tongue: "Tongue",
  laces: "Laces",
  midsole: "Midsole",
  outsole: "Outsole",
};

export type ShoeSide = "left" | "right";

export type SubstanceKind =
  | "mud"
  | "water"
  | "grass"
  | "dust"
  | "paint"
  | "gum"
  | "oil"
  | "snow"
  | "food"
  | "drink";

export type SneakerMaterial = "leather" | "suede" | "mesh" | "canvas" | "patent" | "knit";

export type ZoneDirt = {
  amount: number;
  wetness: number;
  substances: Partial<Record<SubstanceKind, number>>;
};

export type ShoeCondition = {
  dirt: Record<DirtZone, ZoneDirt>;
  creases: number;
  scuffs: number;
  soleWear: number;
  laceCondition: number;
  odor: number;
};

export type ContaminationEvent = {
  shoe: ShoeSide;
  zone: DirtZone;
  substance: SubstanceKind;
  amount: number;
  atDistance: number;
  label: string;
};

const emptyZone = (): ZoneDirt => ({
  amount: 0,
  wetness: 0,
  substances: {},
});

export function createEmptyShoeCondition(): ShoeCondition {
  const dirt = {} as Record<DirtZone, ZoneDirt>;
  for (const z of DIRT_ZONES) dirt[z] = emptyZone();
  return {
    dirt,
    creases: 0,
    scuffs: 0,
    soleWear: 0,
    laceCondition: 100,
    odor: 0,
  };
}

/** How strongly each substance sticks / stains by material (1 = baseline). */
export const MATERIAL_SUBSTANCE_MUL: Record<
  SneakerMaterial,
  Partial<Record<SubstanceKind, number>>
> = {
  leather: { mud: 0.85, water: 0.7, paint: 1.1, food: 0.9, oil: 1.2 },
  suede: { mud: 1.35, water: 1.8, paint: 1.5, dust: 1.2, food: 1.3, snow: 1.6 },
  mesh: { mud: 1.1, water: 1.25, dust: 1.4, paint: 1.2, food: 1.15 },
  canvas: { mud: 1.0, water: 1.1, grass: 1.3, paint: 1.25, food: 1.2 },
  patent: { mud: 0.55, water: 0.4, paint: 0.9, food: 0.7, oil: 1.4, dust: 0.6 },
  knit: { mud: 1.15, water: 1.35, dust: 1.25, paint: 1.3, food: 1.2, gum: 0.9 },
};

/** Default contact zones when a substance hits a shoe. */
export const SUBSTANCE_ZONES: Record<SubstanceKind, DirtZone[]> = {
  mud: ["outsole", "midsole"],
  water: ["outsole"],
  grass: ["outsole", "midsole"],
  dust: ["toeBox", "tongue", "laces"],
  paint: ["outsole", "midsole", "toeBox"],
  gum: ["outsole"],
  oil: ["outsole", "midsole"],
  snow: ["outsole", "midsole", "heel"],
  food: ["toeBox", "laces", "tongue"],
  drink: ["toeBox", "midsole", "laces"],
};

/** Splash / deeper contact adds upper zones. */
export const SPLASH_EXTRA_ZONES: DirtZone[] = ["midsole", "toeBox", "leftSide", "rightSide"];

export const SUBSTANCE_BASE_DIRT: Record<SubstanceKind, number> = {
  mud: 14,
  water: 4,
  grass: 8,
  dust: 3,
  paint: 18,
  gum: 6,
  oil: 10,
  snow: 5,
  food: 12,
  drink: 10,
};

export const SUBSTANCE_LABELS: Record<SubstanceKind, string> = {
  mud: "MUD",
  water: "WATER",
  grass: "GRASS",
  dust: "DUST",
  paint: "PAINT",
  gum: "GUM",
  oil: "OIL",
  snow: "SNOW",
  food: "FOOD",
  drink: "SPILL",
};

export const SUBSTANCE_COLORS: Record<SubstanceKind, string> = {
  mud: "#5c4033",
  water: "#3a7ca5",
  grass: "#3d5c3a",
  dust: "#a89878",
  paint: "#5b8da8",
  gum: "#d94f9c",
  oil: "#2a2a2a",
  snow: "#c8d8e8",
  food: "#c45c26",
  drink: "#e07040",
};

/** Wet shoes attract more dirt. */
export function wetnessStickMultiplier(wetness: number): number {
  return 1 + Math.min(1.2, wetness / 80);
}

export function zoneCleanliness(zone: ZoneDirt): number {
  return Math.max(0, 100 - zone.amount);
}

export function shoeCleanliness(shoe: ShoeCondition): number {
  let sum = 0;
  for (const z of DIRT_ZONES) sum += zoneCleanliness(shoe.dirt[z]);
  return sum / DIRT_ZONES.length;
}

export function pairCleanliness(left: ShoeCondition, right: ShoeCondition): number {
  return (shoeCleanliness(left) + shoeCleanliness(right)) / 2;
}

export function overallConditionScore(shoe: ShoeCondition): number {
  const clean = shoeCleanliness(shoe);
  const creasePenalty = shoe.creases * 0.35;
  const scuffPenalty = shoe.scuffs * 0.5;
  const wearPenalty = shoe.soleWear * 0.25;
  const lacePenalty = (100 - shoe.laceCondition) * 0.15;
  const odorPenalty = shoe.odor * 0.2;
  return Math.max(
    0,
    Math.min(100, clean - creasePenalty - scuffPenalty - wearPenalty - lacePenalty - odorPenalty),
  );
}

export type ApplyDirtArgs = {
  shoe: ShoeCondition;
  substance: SubstanceKind;
  material: SneakerMaterial;
  intensity?: number;
  splash?: boolean;
  zones?: DirtZone[];
  sideBias?: "left" | "right" | "center";
};

export function applySubstanceToShoe(args: ApplyDirtArgs): {
  shoe: ShoeCondition;
  hitZones: DirtZone[];
  amountApplied: number;
} {
  const intensity = args.intensity ?? 1;
  const baseZones = args.zones ?? SUBSTANCE_ZONES[args.substance];
  const zones = [...baseZones];
  if (args.splash) {
    for (const z of SPLASH_EXTRA_ZONES) {
      if (!zones.includes(z)) zones.push(z);
    }
  }
  if (args.sideBias === "left" && !zones.includes("leftSide")) zones.push("leftSide");
  if (args.sideBias === "right" && !zones.includes("rightSide")) zones.push("rightSide");

  const matMul = MATERIAL_SUBSTANCE_MUL[args.material][args.substance] ?? 1;
  const avgWet = DIRT_ZONES.reduce((a, z) => a + args.shoe.dirt[z].wetness, 0) / DIRT_ZONES.length;
  const wetMul = wetnessStickMultiplier(avgWet);
  const base = SUBSTANCE_BASE_DIRT[args.substance] * intensity * matMul * wetMul;
  const perZone = base / Math.max(1, zones.length);

  const next: ShoeCondition = {
    ...args.shoe,
    dirt: { ...args.shoe.dirt },
  };

  let amountApplied = 0;
  for (const z of zones) {
    const prev = next.dirt[z];
    const add = Math.min(100 - prev.amount, perZone);
    const substances = { ...prev.substances };
    substances[args.substance] = (substances[args.substance] ?? 0) + add;
    let wetness = prev.wetness;
    if (args.substance === "water" || args.substance === "snow" || args.substance === "drink") {
      wetness = Math.min(100, wetness + perZone * 1.4);
    }
    if (args.substance === "mud" || args.substance === "oil") {
      wetness = Math.min(100, wetness + perZone * 0.4);
    }
    next.dirt[z] = {
      amount: Math.min(100, prev.amount + add),
      wetness,
      substances,
    };
    amountApplied += add;
  }

  if (args.substance === "gum") {
    next.soleWear = Math.min(100, next.soleWear + 2 * intensity);
  }
  if (args.substance === "paint" || args.substance === "food") {
    next.odor = Math.min(100, next.odor + 1.5 * intensity);
  }

  return { shoe: next, hitZones: zones, amountApplied };
}

export function dryShoeTick(shoe: ShoeCondition, dt: number): ShoeCondition {
  const next: ShoeCondition = { ...shoe, dirt: { ...shoe.dirt } };
  for (const z of DIRT_ZONES) {
    const prev = next.dirt[z];
    if (prev.wetness <= 0) continue;
    next.dirt[z] = {
      ...prev,
      wetness: Math.max(0, prev.wetness - 8 * dt),
    };
  }
  return next;
}

export function applyCreaseWear(
  shoe: ShoeCondition,
  opts: { sprinting: boolean; creaseWalk: boolean; dt: number; jumping: boolean },
): ShoeCondition {
  let creases = shoe.creases;
  let soleWear = shoe.soleWear;
  let laceCondition = shoe.laceCondition;
  if (opts.creaseWalk) {
    creases = Math.min(100, creases + 0.15 * opts.dt);
  } else if (opts.sprinting) {
    creases = Math.min(100, creases + 4.5 * opts.dt);
    soleWear = Math.min(100, soleWear + 1.2 * opts.dt);
    laceCondition = Math.max(0, laceCondition - 0.8 * opts.dt);
  } else {
    creases = Math.min(100, creases + 1.2 * opts.dt);
    soleWear = Math.min(100, soleWear + 0.35 * opts.dt);
  }
  if (opts.jumping) {
    creases = Math.min(100, creases + 0.8);
    soleWear = Math.min(100, soleWear + 0.4);
  }
  return { ...shoe, creases, soleWear, laceCondition };
}

export function applyScuff(shoe: ShoeCondition, amount = 3): ShoeCondition {
  return {
    ...shoe,
    scuffs: Math.min(100, shoe.scuffs + amount),
    dirt: {
      ...shoe.dirt,
      toeBox: {
        ...shoe.dirt.toeBox,
        amount: Math.min(100, shoe.dirt.toeBox.amount + amount * 0.3),
      },
    },
  };
}

/** Dominant stain color for a zone (for Shoe-Cam viz). */
export function zoneStainColor(zone: ZoneDirt): string | null {
  let best: SubstanceKind | null = null;
  let bestAmt = 0;
  for (const [k, v] of Object.entries(zone.substances) as [SubstanceKind, number][]) {
    if (v > bestAmt) {
      bestAmt = v;
      best = k;
    }
  }
  if (!best || zone.amount < 2) return null;
  return SUBSTANCE_COLORS[best];
}

export function worstContamination(events: ContaminationEvent[]): ContaminationEvent | null {
  if (!events.length) return null;
  return events.reduce((a, b) => (b.amount > a.amount ? b : a));
}
