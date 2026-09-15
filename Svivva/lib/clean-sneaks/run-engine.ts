import { ALL_OBSTACLES, ALL_POWERUPS, LANES, OBSTACLE_META, POWERUP_META } from "./constants";
import { computeFrameScore } from "./storage";
import type { ObstacleKind, PowerUpKind } from "./types";
import {
  applyCreaseWear,
  applyScuff,
  applySubstanceToShoe,
  createEmptyShoeCondition,
  dryShoeTick,
  overallConditionScore,
  pairCleanliness,
  shoeCleanliness,
  SUBSTANCE_LABELS,
  zoneStainColor,
  type ContaminationEvent,
  type ShoeCondition,
  type ShoeSide,
  DIRT_ZONES,
} from "./dirt-system";
import { getArchetype, type SneakerArchetypeId } from "./sneaker-catalog";
import {
  SNEAK_VISION_COOLDOWN_MS,
  SNEAK_VISION_DURATION_MS,
  suggestCleanPaths,
  type CleanPathOption,
} from "./sneak-vision";
import {
  contactForObstacle,
  OH_NO_ACTIONS,
  pickOhNoAction,
  pickWeatherWeighted,
  WEATHER,
  WALK_STYLES,
  type OhNoAction,
  type OhNoWindow,
  type WalkStyleId,
  type WeatherId,
} from "./contact-map";
import type { HudShoeSnapshot } from "./types";

export const LANE_X = [-2.4, 0, 2.4] as const;
export const PLAYER_Z = 0;
export const SPAWN_Z = -72;
export const DESPAWN_Z = 14;
export const COLLISION_Z_MIN = -1.2;
export const COLLISION_Z_MAX = 1.4;
export const OH_NO_Z_ENTER = -2.4;
export const OH_NO_Z_EXIT = -1.35;

export type RunObstacle = {
  id: number;
  kind: ObstacleKind;
  lane: number;
  z: number;
  hit: boolean;
  cleared: boolean;
  closeCalled: boolean;
  ohNoOffered: boolean;
};

export type RunPowerUp = {
  id: number;
  kind: PowerUpKind;
  lane: number;
  z: number;
  taken: boolean;
};

export type RunPopup = {
  text: string;
  life: number;
  color: string;
};

export type RunEngineState = {
  running: boolean;
  score: number;
  distance: number;
  cleanliness: number;
  streak: number;
  maxStreak: number;
  cleanChain: number;
  maxCleanChain: number;
  closeCalls: number;
  styleScore: number;
  lane: number;
  targetLane: number;
  laneX: number;
  y: number;
  vy: number;
  grounded: boolean;
  speed: number;
  spawnAcc: number;
  powerAcc: number;
  weatherAcc: number;
  pathAcc: number;
  obstacles: RunObstacle[];
  powerups: RunPowerUp[];
  popups: RunPopup[];
  nextId: number;
  shieldUntil: number;
  freshUntil: number;
  perfectUntil: number;
  sneakVisionUntil: number;
  sneakVisionCooldownUntil: number;
  pathsUntil: number;
  paths: CleanPathOption[] | null;
  shake: number;
  lastTs: number;
  cleanAcc: number;
  lastDirtAt: number;
  walkPhase: number;
  best: number;
  left: ShoeCondition;
  right: ShoeCondition;
  contaminations: ContaminationEvent[];
  archetypeId: SneakerArchetypeId;
  weather: WeatherId;
  walkStyle: WalkStyleId;
  ohNo: OhNoWindow | null;
  npcLine: string | null;
  npcLineUntil: number;
  gumSlowUntil: number;
};

function randItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function laneWorldX(laneBlend: number): number {
  const i0 = Math.max(0, Math.min(LANES - 1, Math.floor(laneBlend)));
  const i1 = Math.max(0, Math.min(LANES - 1, Math.ceil(laneBlend)));
  const t = laneBlend - Math.floor(laneBlend);
  return LANE_X[i0]! + (LANE_X[i1]! - LANE_X[i0]!) * t;
}

export function createRunEngineState(
  best = 0,
  archetypeId: SneakerArchetypeId = "baloon8",
): RunEngineState {
  return {
    running: false,
    score: 0,
    distance: 0,
    cleanliness: 100,
    streak: 0,
    maxStreak: 0,
    cleanChain: 0,
    maxCleanChain: 0,
    closeCalls: 0,
    styleScore: 0,
    lane: 1,
    targetLane: 1,
    laneX: 1,
    y: 0,
    vy: 0,
    grounded: true,
    speed: 280,
    spawnAcc: 0,
    powerAcc: 0,
    weatherAcc: 0,
    pathAcc: 0,
    obstacles: [],
    powerups: [],
    popups: [],
    nextId: 1,
    shieldUntil: 0,
    freshUntil: 0,
    perfectUntil: 0,
    sneakVisionUntil: 0,
    sneakVisionCooldownUntil: 0,
    pathsUntil: 0,
    paths: null,
    shake: 0,
    lastTs: 0,
    cleanAcc: 0,
    lastDirtAt: 0,
    walkPhase: 0,
    best,
    left: createEmptyShoeCondition(),
    right: createEmptyShoeCondition(),
    contaminations: [],
    archetypeId,
    weather: "clear",
    walkStyle: "normal",
    ohNo: null,
    npcLine: null,
    npcLineUntil: 0,
    gumSlowUntil: 0,
  };
}

export type RunEngineCallbacks = {
  onGameOver: () => void;
  onStreakFlash?: () => void;
};

function wetObstacles(): ObstacleKind[] {
  return ["water", "mud", "pothole", "drink", "grass"];
}

function spawnKind(weather: WeatherId): ObstacleKind {
  const wetBias = WEATHER[weather].wetBias;
  if (wetBias > 0 && Math.random() < wetBias) return randItem(wetObstacles());
  return randItem(ALL_OBSTACLES);
}

function syncPairClean(s: RunEngineState): void {
  s.cleanliness = pairCleanliness(s.left, s.right);
}

function npcForCleanliness(clean: number): string {
  if (clean >= 98) return "Those are spotless.";
  if (clean >= 90) return "Yo, don't crease those.";
  if (clean >= 70) return "What happened to your shoes?";
  if (clean >= 40) return "Bro… it's getting bad.";
  if (clean >= 20) return "Bro… it's over.";
  return "Those kicks are cooked.";
}

function maybeNpcLine(s: RunEngineState, ts: number): void {
  if (ts < s.npcLineUntil) return;
  if (Math.random() > 0.08) return;
  s.npcLine = npcForCleanliness(s.cleanliness);
  s.npcLineUntil = ts + 3200;
}

export function snapshotShoes(s: RunEngineState): {
  left: HudShoeSnapshot;
  right: HudShoeSnapshot;
} {
  const snap = (side: ShoeSide, shoe: ShoeCondition): HudShoeSnapshot => {
    const zones = {} as HudShoeSnapshot["zones"];
    for (const z of DIRT_ZONES) {
      zones[z] = {
        amount: shoe.dirt[z].amount,
        wetness: shoe.dirt[z].wetness,
        color: zoneStainColor(shoe.dirt[z]),
      };
    }
    return {
      side,
      cleanliness: shoeCleanliness(shoe),
      zones,
      creases: shoe.creases,
      scuffs: shoe.scuffs,
    };
  };
  return { left: snap("left", s.left), right: snap("right", s.right) };
}

export function activateSneakVision(s: RunEngineState, ts: number): boolean {
  if (!s.running) return false;
  if (ts < s.sneakVisionCooldownUntil) return false;
  s.sneakVisionUntil = ts + SNEAK_VISION_DURATION_MS;
  s.sneakVisionCooldownUntil = ts + SNEAK_VISION_COOLDOWN_MS;
  s.paths = suggestCleanPaths({
    obstacles: s.obstacles,
    currentLane: s.lane,
    cleanliness: s.cleanliness,
  });
  s.pathsUntil = ts + SNEAK_VISION_DURATION_MS;
  s.popups.push({ text: "SNEAK VISION", life: 0.8, color: "#7EC8D9" });
  return true;
}

export function setWalkStyle(s: RunEngineState, style: WalkStyleId): void {
  s.walkStyle = style;
  const meta = WALK_STYLES[style];
  s.popups.push({ text: meta.label, life: 0.55, color: "#e8e8ec" });
}

export function cycleWalkStyle(s: RunEngineState): void {
  const order: WalkStyleId[] = [
    "normal",
    "tiptoe",
    "creaseWalk",
    "heelWalk",
    "wideStep",
    "sideStep",
  ];
  const i = order.indexOf(s.walkStyle);
  setWalkStyle(s, order[(i + 1) % order.length]!);
}

export function tryOhNoAction(s: RunEngineState, action: OhNoAction, ts: number): boolean {
  const w = s.ohNo;
  if (!w || !w.active || w.resolved || ts > w.endsAt) return false;
  w.resolved = true;
  w.active = false;
  if (action === w.correctAction) {
    const o = s.obstacles.find((x) => x.id === w.obstacleId);
    if (o) {
      o.hit = true;
      o.cleared = true;
    }
    s.cleanChain += 1;
    s.maxCleanChain = Math.max(s.maxCleanChain, s.cleanChain);
    s.styleScore += 120 + s.cleanChain * 8;
    s.score += 180 + s.cleanChain * 15;
    s.closeCalls += 1;
    s.popups.push({ text: "DRAMATIC SAVE", life: 1.0, color: "#7EC8D9" });
    bumpStreak(s);
    return true;
  }
  if (action === "sacrificeOther") {
    const other: ShoeSide = w.shoe === "left" ? "right" : "left";
    dirtyShoe(s, other, w.obstacleId, ts, () => {}, 0.55);
    const o = s.obstacles.find((x) => x.id === w.obstacleId);
    if (o) {
      o.hit = true;
      o.cleared = true;
    }
    s.popups.push({ text: "SACRIFICED", life: 0.9, color: "#D94F9C" });
    return true;
  }
  s.popups.push({ text: "MISSED SAVE", life: 0.7, color: "#D94F9C" });
  return false;
}

function dirtyShoe(
  s: RunEngineState,
  shoeSide: ShoeSide,
  obstacleId: number,
  ts: number,
  onGameOver: () => void,
  intensityScale = 1,
): void {
  if (ts < s.shieldUntil) {
    s.popups.push({ text: "SHIELD", life: 0.6, color: "#5B8DA8" });
    return;
  }
  const o = s.obstacles.find((x) => x.id === obstacleId);
  if (!o) return;
  const contact = contactForObstacle(o.kind);
  const arch = getArchetype(s.archetypeId);
  const jumpingSplash = s.y < -20 && contact.splash;
  const intensity =
    contact.intensity *
    intensityScale *
    arch.damagePenalty *
    (jumpingSplash ? 1.25 : 1) *
    (s.speed > 450 ? 1.1 : 1);

  let sideBias: "left" | "right" | "center" | undefined;
  if (o.lane < s.lane) sideBias = "left";
  else if (o.lane > s.lane) sideBias = "right";

  const shoe = shoeSide === "left" ? s.left : s.right;
  const result = applySubstanceToShoe({
    shoe,
    substance: contact.substance,
    material: arch.material,
    intensity,
    splash: contact.splash || jumpingSplash || s.speed > 400,
    zones: contact.zones,
    sideBias,
  });

  if (contact.canScuff) {
    const scuffed = applyScuff(result.shoe, 2.5 * intensity);
    if (shoeSide === "left") s.left = scuffed;
    else s.right = scuffed;
  } else if (shoeSide === "left") s.left = result.shoe;
  else s.right = result.shoe;

  const primaryZone = result.hitZones[0] ?? "outsole";
  const evt: ContaminationEvent = {
    shoe: shoeSide,
    zone: primaryZone,
    substance: contact.substance,
    amount: result.amountApplied,
    atDistance: s.distance,
    label: SUBSTANCE_LABELS[contact.substance],
  };
  s.contaminations.push(evt);

  if (contact.substance === "gum") s.gumSlowUntil = ts + 2800;

  syncPairClean(s);
  s.streak = 0;
  s.cleanChain = 0;
  s.cleanAcc = 0;
  s.lastDirtAt = ts;
  s.shake = Math.min(10, 3 + result.amountApplied / 4);
  const sideTag = shoeSide === "left" ? "L" : "R";
  s.popups.push({
    text: `-${Math.round(result.amountApplied)}% ${evt.label} · ${sideTag} ${primaryZone}`,
    life: 0.95,
    color: "#D94F9C",
  });
  maybeNpcLine(s, ts);
  if (s.cleanliness <= 0) onGameOver();
}

function pickHitShoe(s: RunEngineState, prefer: ShoeSide | "both" | null): ShoeSide {
  if (prefer === "left" || prefer === "right") return prefer;
  const leftC = shoeCleanliness(s.left);
  const rightC = shoeCleanliness(s.right);
  // Prefer dirtying the already-dirtier shoe slightly (two-shoe problem)
  if (prefer === "both") {
    if (Math.abs(leftC - rightC) > 12) return leftC < rightC ? "left" : "right";
    return Math.random() < 0.5 ? "left" : "right";
  }
  if (leftC < rightC - 8) return "left";
  if (rightC < leftC - 8) return "right";
  return Math.random() < 0.5 ? "left" : "right";
}

function applyDirtFromObstacle(
  s: RunEngineState,
  o: RunObstacle,
  ts: number,
  onGameOver: () => void,
): void {
  const contact = contactForObstacle(o.kind);
  const arch = getArchetype(s.archetypeId);
  let shoe = pickHitShoe(s, contact.preferShoe);
  // High-top ankle protection: chance to deflect side hits
  if (arch.ankleProtection > 0 && (contact.zones?.includes("heel") || o.kind === "pedestrian")) {
    if (Math.random() < arch.ankleProtection) {
      s.popups.push({ text: "ANKLE SAVE", life: 0.7, color: "#7EC8D9" });
      o.cleared = true;
      bumpStreak(s);
      return;
    }
  }
  dirtyShoe(s, shoe, o.id, ts, onGameOver);
  // Both shoes for puddle/mud when grounded and not jumping
  if (contact.preferShoe === "both" && s.grounded && Math.random() < 0.45) {
    const other: ShoeSide = shoe === "left" ? "right" : "left";
    dirtyShoe(s, other, o.id, ts, onGameOver, 0.55);
  }
}

export function stepRunEngine(
  s: RunEngineState,
  dt: number,
  ts: number,
  callbacks: RunEngineCallbacks,
): void {
  if (!s.running) return;

  // Oh No cinematic — time crawls
  const ohNoSlow = s.ohNo?.active && !s.ohNo.resolved && ts <= s.ohNo.endsAt ? 0.22 : 1;

  const arch = getArchetype(s.archetypeId);
  const walk = WALK_STYLES[s.walkStyle];
  const weather = WEATHER[s.weather];
  const gumSlow = ts < s.gumSlowUntil ? 0.72 : 1;
  const slow =
    (ts < s.perfectUntil ? 0.45 : 1) * walk.speedMul * weather.speedMul * gumSlow * ohNoSlow;
  const step = dt * slow;

  s.laneX += (s.targetLane - s.laneX) * Math.min(1, step * (12 - walk.balanceHard * 5));
  s.lane = Math.round(s.targetLane);

  if (!s.grounded) {
    s.vy += 1600 * step;
    s.y += s.vy * step;
    if (s.y >= 0) {
      s.y = 0;
      s.vy = 0;
      s.grounded = true;
    }
  }

  const baseSpeed = Math.min(620, 280 + s.distance * 0.35) * arch.agility;
  s.speed = baseSpeed;
  const scroll = s.speed * step;
  s.distance += scroll * 0.05;
  s.score +=
    computeFrameScore({
      distanceDelta: scroll * 0.05,
      cleanliness: s.cleanliness,
      streak: s.streak,
      freshKicksActive: ts < s.freshUntil,
    }) * arch.styleMul;

  // Style from expressive walking
  if (s.walkStyle !== "normal") {
    s.styleScore += step * 6 * arch.styleMul;
  }

  s.left = dryShoeTick(s.left, step);
  s.right = dryShoeTick(s.right, step);
  const sprinting = s.speed > 420 && s.walkStyle === "normal";
  const creaseOpts = {
    sprinting,
    creaseWalk: s.walkStyle === "creaseWalk" || s.walkStyle === "tiptoe",
    dt: step * walk.creaseMul,
    jumping: !s.grounded,
  };
  s.left = applyCreaseWear(s.left, creaseOpts);
  s.right = applyCreaseWear(s.right, creaseOpts);
  syncPairClean(s);

  s.weatherAcc += step;
  if (s.weatherAcc > 18) {
    s.weatherAcc = 0;
    const next = pickWeatherWeighted(s.distance);
    if (next !== s.weather) {
      s.weather = next;
      s.popups.push({ text: WEATHER[next].label, life: 1.0, color: "#5B8DA8" });
    }
  }

  s.pathAcc += step;
  if (s.pathAcc > 9 && (!s.paths || ts > s.pathsUntil)) {
    s.pathAcc = 0;
    if (Math.random() < 0.4) {
      s.paths = suggestCleanPaths({
        obstacles: s.obstacles,
        currentLane: s.lane,
        cleanliness: s.cleanliness,
      });
      s.pathsUntil = ts + 3500;
    }
  }
  if (s.paths && ts > s.pathsUntil) s.paths = null;

  s.spawnAcc += step;
  const spawnEvery = Math.max(0.55, 1.35 - s.distance * 0.002);
  if (s.spawnAcc >= spawnEvery) {
    s.spawnAcc = 0;
    const count = s.distance > 80 && Math.random() < 0.35 ? 2 : 1;
    const used = new Set<number>();
    for (let i = 0; i < count; i++) {
      let lane = Math.floor(Math.random() * LANES);
      let guard = 0;
      while (used.has(lane) && guard++ < 5) lane = Math.floor(Math.random() * LANES);
      used.add(lane);
      s.obstacles.push({
        id: s.nextId++,
        kind: spawnKind(s.weather),
        lane,
        z: SPAWN_Z - i * 8,
        hit: false,
        cleared: false,
        closeCalled: false,
        ohNoOffered: false,
      });
    }
  }

  s.powerAcc += step;
  if (s.powerAcc >= 4.5 + Math.random() * 2) {
    s.powerAcc = 0;
    s.powerups.push({
      id: s.nextId++,
      kind: randItem(ALL_POWERUPS),
      lane: Math.floor(Math.random() * LANES),
      z: SPAWN_Z - 4,
      taken: false,
    });
  }

  for (const o of s.obstacles) o.z += scroll * 0.08;
  for (const p of s.powerups) p.z += scroll * 0.08;
  s.obstacles = s.obstacles.filter((o) => o.z < DESPAWN_Z);
  s.powerups = s.powerups.filter((p) => p.z < DESPAWN_Z && !p.taken);

  // Oh No window — milliseconds before contact
  if (s.ohNo && (s.ohNo.resolved || ts > s.ohNo.endsAt)) {
    if (!s.ohNo.resolved && ts > s.ohNo.endsAt) {
      s.ohNo.active = false;
    }
    if (s.ohNo.resolved || ts > s.ohNo.endsAt + 200) s.ohNo = null;
  }

  for (const o of s.obstacles) {
    if (o.hit || o.cleared || o.ohNoOffered) continue;
    if (o.lane !== s.lane) continue;
    if (o.z >= OH_NO_Z_ENTER && o.z <= OH_NO_Z_EXIT && s.grounded) {
      const meta = OBSTACLE_META[o.kind];
      if (s.y < -28 && meta.jumpable) continue;
      o.ohNoOffered = true;
      const contact = contactForObstacle(o.kind);
      const shoe = pickHitShoe(s, contact.preferShoe);
      s.ohNo = {
        active: true,
        obstacleId: o.id,
        shoe,
        startedAt: ts,
        endsAt: ts + 720,
        correctAction: pickOhNoAction(),
        resolved: false,
      };
      s.popups.push({ text: "OH NO!", life: 0.5, color: "#ffcc66" });
    }
  }

  for (const o of s.obstacles) {
    if (o.hit) continue;
    const meta = OBSTACLE_META[o.kind];
    const jumpingOver = s.y < -28 && meta.jumpable;
    if (jumpingOver || o.lane !== s.lane) continue;
    if (o.z >= COLLISION_Z_MIN && o.z <= COLLISION_Z_MAX) {
      // If Oh No still active for this obstacle, don't auto-hit yet
      if (s.ohNo?.active && s.ohNo.obstacleId === o.id && ts <= s.ohNo.endsAt) continue;
      o.hit = true;
      applyDirtFromObstacle(s, o, ts, callbacks.onGameOver);
    }
  }

  // Close calls — same lane, narrowly avoided by jump or lane change after near miss
  for (const o of s.obstacles) {
    if (o.closeCalled || o.hit) continue;
    const contact = contactForObstacle(o.kind);
    const near = o.z > COLLISION_Z_MIN - contact.closeCallPad && o.z < COLLISION_Z_MAX + 0.3;
    if (!near) continue;
    const sameLane = o.lane === s.lane;
    const jumped = s.y < -28 && OBSTACLE_META[o.kind].jumpable;
    const adjacent =
      Math.abs(o.lane - s.lane) === 1 && o.z > COLLISION_Z_MIN - 0.4 && o.z < COLLISION_Z_MAX + 0.2;
    if ((sameLane && jumped) || adjacent) {
      o.closeCalled = true;
      s.closeCalls += 1;
      s.cleanChain += 1;
      s.maxCleanChain = Math.max(s.maxCleanChain, s.cleanChain);
      const bonus = 40 + s.cleanChain * 12;
      s.score += bonus;
      s.styleScore += bonus * 0.5;
      s.popups.push({
        text: `CLOSE CALL +${bonus}`,
        life: 0.75,
        color: "#7EC8D9",
      });
    }
  }

  for (const p of s.powerups) {
    if (p.taken || p.lane !== s.lane) continue;
    if (p.z >= COLLISION_Z_MIN && p.z <= COLLISION_Z_MAX && Math.abs(s.y) < 40) {
      p.taken = true;
      const meta = POWERUP_META[p.kind];
      s.popups.push({ text: meta.label, life: 0.9, color: meta.color });
      if (p.kind === "shield") s.shieldUntil = ts + meta.durationMs;
      if (p.kind === "freshKicks") s.freshUntil = ts + meta.durationMs;
      if (p.kind === "perfectStep") s.perfectUntil = ts + meta.durationMs;
      if (p.kind === "quickClean") {
        // Emergency clean — wipe outsoles / midsoles lightly
        for (const shoe of [s.left, s.right]) {
          for (const z of ["outsole", "midsole", "toeBox"] as const) {
            shoe.dirt[z].amount = Math.max(0, shoe.dirt[z].amount - (meta.cleanRestore ?? 15));
            shoe.dirt[z].wetness = Math.max(0, shoe.dirt[z].wetness - 20);
          }
        }
        syncPairClean(s);
      }
    }
  }

  for (const o of s.obstacles) {
    if (o.cleared || o.hit) continue;
    if (o.z > COLLISION_Z_MAX + 0.6) {
      o.cleared = true;
      if (o.lane === s.lane) {
        s.cleanChain += 1;
        s.maxCleanChain = Math.max(s.maxCleanChain, s.cleanChain);
        bumpStreak(s, callbacks.onStreakFlash);
      }
    }
  }

  if (ts - s.lastDirtAt > 400) {
    s.cleanAcc += step;
    if (s.cleanAcc >= 2.2) {
      s.cleanAcc = 0;
      s.cleanChain += 1;
      s.maxCleanChain = Math.max(s.maxCleanChain, s.cleanChain);
      bumpStreak(s, callbacks.onStreakFlash);
    }
  }

  for (const p of s.popups) p.life -= step;
  s.popups = s.popups.filter((p) => p.life > 0);
  s.shake *= Math.max(0, 1 - step * 8);
  if (ts > s.npcLineUntil) s.npcLine = null;

  if (s.grounded) {
    s.walkPhase = (s.walkPhase + step * Math.max(1.1, s.speed / 220)) % 1;
  }
}

function bumpStreak(s: RunEngineState, onStreakFlash?: () => void): void {
  s.streak += 1;
  s.maxStreak = Math.max(s.maxStreak, s.streak);
  if (s.streak === 3 || s.streak === 5 || s.streak === 8 || s.streak === 12) {
    onStreakFlash?.();
    const bonus = s.streak * 25 + s.cleanChain * 5;
    s.score += bonus;
    s.popups.push({
      text: `CLEAN CHAIN x${s.cleanChain} +${bonus}`,
      life: 0.9,
      color: "#7EC8D9",
    });
  }
}

export function jumpRun(s: RunEngineState): void {
  if (!s.running || !s.grounded) return;
  // Crease walk makes jumping harder
  if (s.walkStyle === "creaseWalk" && Math.random() < 0.12) {
    s.popups.push({ text: "STIFF LEGS", life: 0.5, color: "#c4a35a" });
    return;
  }
  s.grounded = false;
  const arch = getArchetype(s.archetypeId);
  s.vy = -520 * arch.agility;
}

export function shiftLane(s: RunEngineState, delta: -1 | 1): void {
  s.targetLane = Math.max(0, Math.min(LANES - 1, s.targetLane + delta));
}

export function buildGameOverPayload(
  s: RunEngineState,
  best: number,
  helpers: {
    cleanLabelFrom: (n: number) => import("./types").CleanLabel;
    streakLabelFrom: (n: number) => string;
  },
): import("./types").GameOverPayload {
  const leftC = shoeCleanliness(s.left);
  const rightC = shoeCleanliness(s.right);
  const clean = pairCleanliness(s.left, s.right);
  const condition = (overallConditionScore(s.left) + overallConditionScore(s.right)) / 2;
  const worst =
    s.contaminations.length === 0
      ? null
      : s.contaminations.reduce((a, b) => (b.amount > a.amount ? b : a));
  return {
    score: Math.floor(s.score),
    distance: Math.floor(s.distance),
    cleanliness: Math.max(0, Math.floor(clean)),
    leftClean: Math.floor(leftC),
    rightClean: Math.floor(rightC),
    finalCleanliness: Math.max(0, Math.floor(clean)),
    cleanLabel: helpers.cleanLabelFrom(clean),
    streak: s.streak,
    streakLabel: helpers.streakLabelFrom(s.maxStreak),
    maxStreak: s.maxStreak,
    bestScore: best,
    closeCalls: s.closeCalls,
    styleScore: Math.floor(s.styleScore),
    creases: Math.floor((s.left.creases + s.right.creases) / 2),
    weather: s.weather,
    walkStyle: s.walkStyle,
    sneakVisionActive: false,
    cleanChain: s.cleanChain,
    maxCleanChain: s.maxCleanChain,
    left: s.left,
    right: s.right,
    contaminations: s.contaminations,
    worstHit: worst,
    perfectClean: clean >= 99.5 && s.contaminations.length === 0,
    conditionScore: Math.floor(condition),
  };
}

export { OH_NO_ACTIONS, WALK_STYLES, WEATHER };
