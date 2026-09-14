import {
  ALL_OBSTACLES,
  ALL_POWERUPS,
  DIRT_BY_KIND,
  LANES,
  OBSTACLE_META,
  POWERUP_META,
} from "./constants";
import { computeFrameScore } from "./storage";
import type { ObstacleKind, PowerUpKind } from "./types";

export const LANE_X = [-2.4, 0, 2.4] as const;
export const PLAYER_Z = 0;
export const SPAWN_Z = -72;
export const DESPAWN_Z = 14;
export const COLLISION_Z_MIN = -1.2;
export const COLLISION_Z_MAX = 1.4;

export type RunObstacle = {
  id: number;
  kind: ObstacleKind;
  lane: number;
  z: number;
  hit: boolean;
  cleared: boolean;
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
  lane: number;
  targetLane: number;
  laneX: number;
  y: number;
  vy: number;
  grounded: boolean;
  speed: number;
  spawnAcc: number;
  powerAcc: number;
  obstacles: RunObstacle[];
  powerups: RunPowerUp[];
  popups: RunPopup[];
  nextId: number;
  shieldUntil: number;
  freshUntil: number;
  perfectUntil: number;
  shake: number;
  lastTs: number;
  cleanAcc: number;
  lastDirtAt: number;
  walkPhase: number;
  best: number;
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

export function createRunEngineState(best = 0): RunEngineState {
  return {
    running: false,
    score: 0,
    distance: 0,
    cleanliness: 100,
    streak: 0,
    maxStreak: 0,
    lane: 1,
    targetLane: 1,
    laneX: 1,
    y: 0,
    vy: 0,
    grounded: true,
    speed: 280,
    spawnAcc: 0,
    powerAcc: 0,
    obstacles: [],
    powerups: [],
    popups: [],
    nextId: 1,
    shieldUntil: 0,
    freshUntil: 0,
    perfectUntil: 0,
    shake: 0,
    lastTs: 0,
    cleanAcc: 0,
    lastDirtAt: 0,
    walkPhase: 0,
    best,
  };
}

export type RunEngineCallbacks = {
  onGameOver: () => void;
  onStreakFlash?: () => void;
};

export function stepRunEngine(
  s: RunEngineState,
  dt: number,
  ts: number,
  callbacks: RunEngineCallbacks,
): void {
  if (!s.running) return;

  const slow = ts < s.perfectUntil ? 0.45 : 1;
  const step = dt * slow;

  s.laneX += (s.targetLane - s.laneX) * Math.min(1, step * 12);
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

  s.speed = Math.min(620, 280 + s.distance * 0.35);
  const scroll = s.speed * step;
  s.distance += scroll * 0.05;
  s.score += computeFrameScore({
    distanceDelta: scroll * 0.05,
    cleanliness: s.cleanliness,
    streak: s.streak,
    freshKicksActive: ts < s.freshUntil,
  });

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
        kind: randItem(ALL_OBSTACLES),
        lane,
        z: SPAWN_Z - i * 8,
        hit: false,
        cleared: false,
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

  for (const o of s.obstacles) {
    if (o.hit) continue;
    const meta = OBSTACLE_META[o.kind];
    const jumpingOver = s.y < -28 && meta.jumpable;
    if (jumpingOver || o.lane !== s.lane) continue;
    if (o.z >= COLLISION_Z_MIN && o.z <= COLLISION_Z_MAX) {
      o.hit = true;
      applyDirt(s, DIRT_BY_KIND[o.kind], meta.label, ts, callbacks.onGameOver);
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
        s.cleanliness = Math.min(100, s.cleanliness + (meta.cleanRestore ?? 15));
      }
    }
  }

  for (const o of s.obstacles) {
    if (o.cleared || o.hit) continue;
    if (o.z > COLLISION_Z_MAX + 0.6) {
      o.cleared = true;
      if (o.lane === s.lane) bumpStreak(s, callbacks.onStreakFlash);
    }
  }

  if (ts - s.lastDirtAt > 400) {
    s.cleanAcc += step;
    if (s.cleanAcc >= 2.2) {
      s.cleanAcc = 0;
      bumpStreak(s, callbacks.onStreakFlash);
    }
  }

  for (const p of s.popups) p.life -= step;
  s.popups = s.popups.filter((p) => p.life > 0);
  s.shake *= Math.max(0, 1 - step * 8);

  if (s.grounded) {
    s.walkPhase = (s.walkPhase + step * Math.max(1.1, s.speed / 220)) % 1;
  }
}

function applyDirt(
  s: RunEngineState,
  amount: number,
  label: string,
  ts: number,
  onGameOver: () => void,
): void {
  if (ts < s.shieldUntil) {
    s.popups.push({ text: "SHIELD", life: 0.6, color: "#5B8DA8" });
    return;
  }
  s.cleanliness = Math.max(0, s.cleanliness - amount);
  s.streak = 0;
  s.cleanAcc = 0;
  s.lastDirtAt = ts;
  s.shake = Math.min(10, 3 + amount / 4);
  s.popups.push({
    text: `-${amount}% ${label}`,
    life: 0.8,
    color: "#D94F9C",
  });
  if (s.cleanliness <= 0) onGameOver();
}

function bumpStreak(s: RunEngineState, onStreakFlash?: () => void): void {
  s.streak += 1;
  s.maxStreak = Math.max(s.maxStreak, s.streak);
  if (s.streak === 3 || s.streak === 5 || s.streak === 8 || s.streak === 12) {
    onStreakFlash?.();
    const bonus = s.streak * 25;
    s.score += bonus;
    s.popups.push({
      text: `CLEAN x${s.streak >= 12 ? 5 : s.streak >= 8 ? 4 : s.streak >= 5 ? 3 : 2} +${bonus}`,
      life: 0.9,
      color: "#7EC8D9",
    });
  }
}

export function jumpRun(s: RunEngineState): void {
  if (!s.running || !s.grounded) return;
  s.grounded = false;
  s.vy = -520;
}

export function shiftLane(s: RunEngineState, delta: -1 | 1): void {
  s.targetLane = Math.max(0, Math.min(LANES - 1, s.targetLane + delta));
}
