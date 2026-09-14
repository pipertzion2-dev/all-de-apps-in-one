"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import {
  ALL_OBSTACLES,
  ALL_POWERUPS,
  DIRT_BY_KIND,
  LANES,
  OBSTACLE_META,
  POWERUP_META,
} from "@/lib/clean-sneaks/constants";
import { cleanLabelFrom, resolvePlayerSneaker, streakLabelFrom } from "@/lib/clean-sneaks/assets";
import {
  computeFrameScore,
  readBestScore,
  shareScore,
  writeBestScore,
} from "@/lib/clean-sneaks/storage";
import type {
  GameOverPayload,
  ObstacleKind,
  PowerUpKind,
  RunStats,
  SneakerAssetRef,
} from "@/lib/clean-sneaks/types";

type Obstacle = {
  id: number;
  kind: ObstacleKind;
  lane: number;
  x: number;
  hit: boolean;
  cleared: boolean;
};

type PowerUp = {
  id: number;
  kind: PowerUpKind;
  lane: number;
  x: number;
  taken: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

type Popup = {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
};

export type CleanSneaksGameProps = {
  active: boolean;
  onExit?: () => void;
  onStats?: (stats: RunStats) => void;
  sneakerOverride?: Partial<SneakerAssetRef> | null;
  className?: string;
  style?: CSSProperties;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function randItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function CleanSneaksGame({
  active,
  onExit,
  onStats,
  sneakerOverride,
  className,
  style,
}: CleanSneaksGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const sneaker = resolvePlayerSneaker(sneakerOverride);

  const [phase, setPhase] = useState<"countdown" | "running" | "over">("countdown");
  const [countdown, setCountdown] = useState(3);
  const [hud, setHud] = useState<RunStats>({
    score: 0,
    distance: 0,
    cleanliness: 100,
    cleanLabel: "FRESH",
    streak: 0,
    streakLabel: "CLEAN x1",
    bestScore: 0,
  });
  const [gameOver, setGameOver] = useState<GameOverPayload | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [flashStreak, setFlashStreak] = useState(false);

  const stateRef = useRef({
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
    obstacles: [] as Obstacle[],
    powerups: [] as PowerUp[],
    particles: [] as Particle[],
    popups: [] as Popup[],
    nextId: 1,
    shieldUntil: 0,
    freshUntil: 0,
    perfectUntil: 0,
    shake: 0,
    shoeImg: null as HTMLImageElement | null,
    lastTs: 0,
    reduced: false,
    touchStart: null as { x: number; y: number; t: number } | null,
    best: 0,
    cleanAcc: 0,
    lastDirtAt: 0,
  });

  const emitStats = useCallback(() => {
    const s = stateRef.current;
    const stats: RunStats = {
      score: Math.floor(s.score),
      distance: Math.floor(s.distance),
      cleanliness: Math.max(0, Math.floor(s.cleanliness)),
      cleanLabel: cleanLabelFrom(s.cleanliness),
      streak: s.streak,
      streakLabel: streakLabelFrom(s.streak),
      bestScore: s.best,
    };
    setHud(stats);
    onStats?.(stats);
  }, [onStats]);

  const resetRun = useCallback(() => {
    const s = stateRef.current;
    s.running = false;
    s.score = 0;
    s.distance = 0;
    s.cleanliness = 100;
    s.streak = 0;
    s.maxStreak = 0;
    s.lane = 1;
    s.targetLane = 1;
    s.laneX = 1;
    s.y = 0;
    s.vy = 0;
    s.grounded = true;
    s.speed = 280;
    s.spawnAcc = 0;
    s.powerAcc = 0;
    s.obstacles = [];
    s.powerups = [];
    s.particles = [];
    s.popups = [];
    s.shieldUntil = 0;
    s.freshUntil = 0;
    s.perfectUntil = 0;
    s.shake = 0;
    s.cleanAcc = 0;
    s.lastDirtAt = 0;
    s.best = readBestScore();
    setGameOver(null);
    setShareMsg(null);
    emitStats();
  }, [emitStats]);

  const endRun = useCallback(() => {
    const s = stateRef.current;
    s.running = false;
    const best = writeBestScore(s.score);
    s.best = best;
    const payload: GameOverPayload = {
      score: Math.floor(s.score),
      distance: Math.floor(s.distance),
      cleanliness: 0,
      finalCleanliness: Math.max(0, Math.floor(s.cleanliness)),
      cleanLabel: "COOKED",
      streak: s.streak,
      streakLabel: streakLabelFrom(s.maxStreak),
      maxStreak: s.maxStreak,
      bestScore: best,
    };
    setGameOver(payload);
    setPhase("over");
    emitStats();
  }, [emitStats]);

  const applyDirt = useCallback(
    (amount: number, label: string) => {
      const s = stateRef.current;
      const now = performance.now();
      if (now < s.shieldUntil) {
        s.popups.push({ x: 120, y: 140, text: "SHIELD", life: 0.6, color: "#5B8DA8" });
        return;
      }
      s.cleanliness = Math.max(0, s.cleanliness - amount);
      s.streak = 0;
      s.cleanAcc = 0;
      s.lastDirtAt = now;
      s.shake = Math.min(10, 3 + amount / 4);
      for (let i = 0; i < 10; i++) {
        s.particles.push({
          x: 110 + Math.random() * 40,
          y: 0,
          vx: (Math.random() - 0.5) * 120,
          vy: -40 - Math.random() * 80,
          life: 0.4 + Math.random() * 0.4,
          color: "#5c4033",
          size: 2 + Math.random() * 3,
        });
      }
      s.popups.push({
        x: 130,
        y: 120,
        text: `-${amount}% ${label}`,
        life: 0.8,
        color: "#D94F9C",
      });
      if (s.cleanliness <= 0) endRun();
    },
    [endRun],
  );

  const bumpStreak = useCallback(() => {
    const s = stateRef.current;
    s.streak += 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    if (s.streak === 3 || s.streak === 5 || s.streak === 8 || s.streak === 12) {
      setFlashStreak(true);
      window.setTimeout(() => setFlashStreak(false), 450);
      const bonus = s.streak * 25;
      s.score += bonus;
      s.popups.push({
        x: 160,
        y: 100,
        text: `${streakLabelFrom(s.streak)} +${bonus}`,
        life: 0.9,
        color: "#7EC8D9",
      });
    }
  }, []);

  useEffect(() => {
    const img = new Image();
    img.decoding = "async";
    img.src = sneaker.spriteUrl;
    img.onload = () => {
      stateRef.current.shoeImg = img;
    };
  }, [sneaker.spriteUrl]);

  useEffect(() => {
    if (!active) return;
    resetRun();
    stateRef.current.reduced = prefersReducedMotion();
    setPhase("countdown");
    setCountdown(3);
    let n = 3;
    const id = window.setInterval(
      () => {
        n -= 1;
        if (n > 0) setCountdown(n);
        else if (n === 0) setCountdown(0);
        else {
          window.clearInterval(id);
          setPhase("running");
          stateRef.current.running = true;
          stateRef.current.lastTs = performance.now();
        }
      },
      stateRef.current.reduced ? 280 : 520,
    );
    return () => window.clearInterval(id);
  }, [active, resetRun]);

  useEffect(() => {
    if (!active || phase !== "running") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let alive = true;
    const s = stateRef.current;

    const resize = () => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = Math.max(320, Math.min(520, Math.round(wrap.clientWidth * 0.56)));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (wrapRef.current) ro.observe(wrapRef.current);

    const laneYs = (h: number) => {
      const base = h * 0.62;
      const gap = Math.min(54, h * 0.1);
      return [base - gap, base, base + gap] as const;
    };

    const frame = (ts: number) => {
      if (!alive) return;
      const rawDt = Math.min(0.05, (ts - s.lastTs) / 1000 || 0.016);
      s.lastTs = ts;
      const slow = ts < s.perfectUntil ? 0.45 : 1;
      const dt = rawDt * slow;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const lanes = laneYs(h);

      s.laneX += (s.targetLane - s.laneX) * Math.min(1, dt * 12);
      s.lane = Math.round(s.targetLane);

      if (!s.grounded) {
        s.vy += 1600 * dt;
        s.y += s.vy * dt;
        if (s.y >= 0) {
          s.y = 0;
          s.vy = 0;
          s.grounded = true;
          for (let i = 0; i < 6; i++) {
            s.particles.push({
              x: 100,
              y: lanes[s.lane]! + 20,
              vx: (Math.random() - 0.5) * 80,
              vy: -20 - Math.random() * 40,
              life: 0.35,
              color: "rgba(126,200,217,0.7)",
              size: 2,
            });
          }
        }
      }

      s.speed = Math.min(620, 280 + s.distance * 0.35);
      const scroll = s.speed * dt;
      s.distance += scroll * 0.05;
      s.score += computeFrameScore({
        distanceDelta: scroll * 0.05,
        cleanliness: s.cleanliness,
        streak: s.streak,
        freshKicksActive: ts < s.freshUntil,
      });

      s.spawnAcc += dt;
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
            x: w + 40 + i * 70,
            hit: false,
            cleared: false,
          });
        }
      }

      s.powerAcc += dt;
      if (s.powerAcc >= 4.5 + Math.random() * 2) {
        s.powerAcc = 0;
        s.powerups.push({
          id: s.nextId++,
          kind: randItem(ALL_POWERUPS),
          lane: Math.floor(Math.random() * LANES),
          x: w + 60,
          taken: false,
        });
      }

      for (const o of s.obstacles) o.x -= scroll;
      for (const p of s.powerups) p.x -= scroll;
      s.obstacles = s.obstacles.filter((o) => o.x > -80);
      s.powerups = s.powerups.filter((p) => p.x > -80 && !p.taken);

      const px = 96;
      for (const o of s.obstacles) {
        if (o.hit) continue;
        const meta = OBSTACLE_META[o.kind];
        const jumpingOver = s.y < -28 && meta.jumpable;
        if (jumpingOver || o.lane !== s.lane) continue;
        if (px + 70 > o.x && px < o.x + meta.w) {
          o.hit = true;
          applyDirt(DIRT_BY_KIND[o.kind], meta.label);
        }
      }

      for (const p of s.powerups) {
        if (p.taken || p.lane !== s.lane) continue;
        if (Math.abs(p.x - px) < 40 && Math.abs(s.y) < 40) {
          p.taken = true;
          const meta = POWERUP_META[p.kind];
          s.popups.push({
            x: px + 40,
            y: lanes[s.lane]! + s.y - 20,
            text: meta.label,
            life: 0.9,
            color: meta.color,
          });
          if (p.kind === "shield") s.shieldUntil = ts + meta.durationMs;
          if (p.kind === "freshKicks") s.freshUntil = ts + meta.durationMs;
          if (p.kind === "perfectStep") s.perfectUntil = ts + meta.durationMs;
          if (p.kind === "quickClean") {
            s.cleanliness = Math.min(100, s.cleanliness + (meta.cleanRestore ?? 15));
          }
          for (let i = 0; i < 12; i++) {
            s.particles.push({
              x: px + 30,
              y: lanes[s.lane]! + s.y,
              vx: (Math.random() - 0.5) * 160,
              vy: (Math.random() - 0.5) * 160,
              life: 0.5,
              color: meta.color,
              size: 2 + Math.random() * 2,
            });
          }
        }
      }

      for (const o of s.obstacles) {
        if (o.cleared || o.hit) continue;
        if (o.x + OBSTACLE_META[o.kind].w < px - 4) {
          o.cleared = true;
          if (o.lane === s.lane) bumpStreak();
        }
      }

      if (ts - s.lastDirtAt > 400) {
        s.cleanAcc += dt;
        if (s.cleanAcc >= 2.2) {
          s.cleanAcc = 0;
          bumpStreak();
        }
      }

      for (const p of s.particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt;
        p.life -= dt;
      }
      s.particles = s.particles.filter((p) => p.life > 0);
      for (const p of s.popups) {
        p.y -= 30 * dt;
        p.life -= dt;
      }
      s.popups = s.popups.filter((p) => p.life > 0);
      s.shake *= Math.max(0, 1 - dt * 8);

      const shx = (Math.random() - 0.5) * s.shake;
      const shy = (Math.random() - 0.5) * s.shake;
      ctx.save();
      ctx.translate(shx, shy);

      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, "#0a0c10");
      bg.addColorStop(0.45, "#12161c");
      bg.addColorStop(1, "#0d1014");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = "rgba(91,141,168,0.08)";
      for (let i = 0; i < 8; i++) {
        const bx = ((i * 97 - ((s.distance * 8) % 97) + w) % (w + 40)) - 20;
        const bh = 40 + ((i * 37) % 80);
        ctx.fillRect(bx, h * 0.28 - bh, 28 + (i % 3) * 10, bh);
      }

      const roadTop = lanes[0]! - 40;
      const roadBot = lanes[2]! + 50;
      ctx.fillStyle = "#151a22";
      ctx.fillRect(0, roadTop, w, roadBot - roadTop);

      ctx.strokeStyle = "rgba(232,232,236,0.18)";
      ctx.lineWidth = 2;
      const dashOff = -((s.distance * 12) % 48);
      for (let li = 0; li < LANES; li++) {
        const ly = lanes[li]!;
        ctx.beginPath();
        for (let x = dashOff; x < w; x += 48) {
          ctx.moveTo(x, ly + 22);
          ctx.lineTo(x + 24, ly + 22);
        }
        ctx.stroke();
      }

      ctx.strokeStyle = "rgba(91,141,168,0.35)";
      ctx.beginPath();
      ctx.moveTo(0, roadTop);
      ctx.lineTo(w, roadTop);
      ctx.stroke();
      ctx.strokeStyle = "rgba(217,79,156,0.25)";
      ctx.beginPath();
      ctx.moveTo(0, roadBot);
      ctx.lineTo(w, roadBot);
      ctx.stroke();

      for (const o of s.obstacles) {
        if (o.hit && o.x < px) continue;
        const meta = OBSTACLE_META[o.kind];
        const oy = lanes[o.lane]!;
        ctx.fillStyle = meta.color;
        ctx.globalAlpha = o.hit ? 0.35 : 0.95;
        if (o.kind === "pothole" || o.kind === "mud" || o.kind === "water" || o.kind === "paint") {
          ctx.beginPath();
          ctx.ellipse(o.x + meta.w / 2, oy + 10, meta.w / 2, meta.h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (o.kind === "pedestrian") {
          ctx.fillRect(o.x, oy - meta.h + 10, meta.w, meta.h);
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(o.x + 6, oy - meta.h, 16, 12);
        } else if (o.kind === "bike") {
          ctx.strokeStyle = meta.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(o.x + 10, oy + 5, 10, 0, Math.PI * 2);
          ctx.arc(o.x + 38, oy + 5, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(o.x + 10, oy + 5);
          ctx.lineTo(o.x + 24, oy - 16);
          ctx.lineTo(o.x + 38, oy + 5);
          ctx.stroke();
        } else {
          ctx.fillRect(o.x, oy - meta.h + 12, meta.w, meta.h);
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "9px Zc, sans-serif";
        ctx.fillText(meta.label, o.x, oy - meta.h - 2);
      }

      for (const p of s.powerups) {
        const meta = POWERUP_META[p.kind];
        const oy = lanes[p.lane]! - 10;
        ctx.save();
        ctx.translate(p.x, oy + Math.sin(ts / 200 + p.id) * 4);
        ctx.fillStyle = meta.color;
        ctx.shadowColor = meta.color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#0a0c10";
        ctx.font = "bold 8px Zc, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(meta.label.slice(0, 1), 0, 3);
        ctx.restore();
      }

      const ly0 = lanes[Math.max(0, Math.min(2, Math.floor(s.laneX)))]!;
      const ly1 = lanes[Math.max(0, Math.min(2, Math.ceil(s.laneX)))]!;
      const lf = s.laneX - Math.floor(s.laneX);
      const smoothY = ly0 + (ly1 - ly0) * lf + s.y;
      const playerX = px - 10;

      if (ts < s.shieldUntil) {
        ctx.strokeStyle = "rgba(91,141,168,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(playerX + 40, smoothY, 55, 28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      const shoe = s.shoeImg;
      const dirt = 1 - s.cleanliness / 100;
      if (shoe && shoe.complete) {
        const sw = 100;
        const sh = Math.round(sw * (shoe.height / Math.max(1, shoe.width)));
        ctx.save();
        ctx.translate(playerX, smoothY - sh + 18);
        const bob = s.grounded && !s.reduced ? Math.sin(ts / 90) * 2 : 0;
        ctx.translate(0, bob);
        ctx.drawImage(shoe, 0, 0, sw, sh);
        if (dirt > 0.02) {
          ctx.globalCompositeOperation = "source-atop";
          ctx.fillStyle = `rgba(55, 40, 28, ${0.15 + dirt * 0.55})`;
          ctx.fillRect(0, 0, sw, sh);
          ctx.fillStyle = `rgba(90, 70, 40, ${dirt * 0.35})`;
          for (let i = 0; i < Math.floor(dirt * 8); i++) {
            ctx.beginPath();
            ctx.ellipse(
              10 + ((i * 37) % (sw - 20)),
              8 + ((i * 19) % (sh - 10)),
              6 + (i % 3) * 3,
              3 + (i % 2) * 2,
              0,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
          ctx.globalCompositeOperation = "source-over";
        }
        if (s.cleanliness >= 80) {
          ctx.strokeStyle = "rgba(126,200,217,0.35)";
          ctx.strokeRect(1, 1, sw - 2, sh - 2);
        }
        ctx.restore();
      } else {
        ctx.fillStyle = "#5B8DA8";
        ctx.fillRect(playerX, smoothY - 24, 70, 28);
        ctx.fillStyle = "#D94F9C";
        ctx.fillRect(playerX + 50, smoothY - 18, 24, 16);
      }

      for (const p of s.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
      for (const p of s.popups) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.font = "bold 12px Zc, sans-serif";
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (Math.floor(ts / 100) % 2 === 0) emitStats();
      if (s.running) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active, phase, applyDirt, bumpStreak, emitStats]);

  useEffect(() => {
    if (!active) return;
    const jump = () => {
      const s = stateRef.current;
      if (!s.running || !s.grounded) return;
      s.grounded = false;
      s.vy = -520;
    };
    const onKey = (e: KeyboardEvent) => {
      if (phase === "over") return;
      const k = e.key.toLowerCase();
      if (
        ["arrowleft", "a", "arrowright", "d", " ", "arrowup", "w"].includes(k) ||
        e.code === "Space"
      ) {
        e.preventDefault();
      }
      if (k === "arrowleft" || k === "a") {
        stateRef.current.targetLane = Math.max(0, stateRef.current.targetLane - 1);
      } else if (k === "arrowright" || k === "d") {
        stateRef.current.targetLane = Math.min(LANES - 1, stateRef.current.targetLane + 1);
      } else if (k === " " || k === "arrowup" || k === "w" || e.code === "Space") {
        jump();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [active, phase]);

  useEffect(() => {
    if (!active || phase === "over") return;
    const el = wrapRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0]!;
      stateRef.current.touchStart = { x: t.clientX, y: t.clientY, t: Date.now() };
    };
    const onMove = (e: TouchEvent) => {
      if (phase === "running") e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      const start = stateRef.current.touchStart;
      stateRef.current.touchStart = null;
      if (!start || !e.changedTouches[0]) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
      if (Math.abs(dy) > Math.abs(dx) && dy < -28) {
        const st = stateRef.current;
        if (st.running && st.grounded) {
          st.grounded = false;
          st.vy = -520;
        }
      } else if (Math.abs(dx) > 28) {
        if (dx < 0) stateRef.current.targetLane = Math.max(0, stateRef.current.targetLane - 1);
        else stateRef.current.targetLane = Math.min(LANES - 1, stateRef.current.targetLane + 1);
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
    };
  }, [active, phase]);

  useEffect(() => {
    if (active) return;
    stateRef.current.running = false;
  }, [active]);

  const runItBack = () => {
    resetRun();
    setPhase("countdown");
    setCountdown(3);
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      if (n > 0) setCountdown(n);
      else if (n === 0) setCountdown(0);
      else {
        window.clearInterval(id);
        setPhase("running");
        stateRef.current.running = true;
        stateRef.current.lastTs = performance.now();
      }
    }, 480);
  };

  const onShare = async () => {
    if (!gameOver) return;
    const result = await shareScore({
      score: gameOver.score,
      distance: gameOver.distance,
      cleanliness: gameOver.finalCleanliness,
    });
    setShareMsg(
      result === "shared"
        ? "Shared."
        : result === "copied"
          ? "Copied to clipboard."
          : "Share unavailable.",
    );
  };

  const cleanPct = hud.cleanliness;
  const cleanTone =
    cleanPct >= 80
      ? "text-[#7EC8D9]"
      : cleanPct >= 60
        ? "text-[#5B8DA8]"
        : cleanPct >= 40
          ? "text-amber-300"
          : cleanPct >= 20
            ? "text-orange-400"
            : "text-[#D94F9C]";

  return (
    <div
      ref={wrapRef}
      className={className}
      style={style}
      role="application"
      aria-label="Clean Sneaks game"
    >
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0a0c10]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#5B8DA8]/80">
              Clean Sneaks
            </p>
            <p className="text-lg font-bold tabular-nums text-foreground sm:text-xl">
              {hud.score.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {hud.distance}m · Best {hud.bestScore.toLocaleString()}
            </p>
          </div>
          <div className="min-w-[140px] max-w-[200px] flex-1 space-y-1 text-right">
            <div className="flex items-center justify-end gap-2">
              <span className={`text-xs font-semibold uppercase tracking-wider ${cleanTone}`}>
                {hud.cleanLabel}
              </span>
              <span className={`text-sm font-bold tabular-nums ${cleanTone}`} aria-live="polite">
                {cleanPct}%
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-white/10"
              role="meter"
              aria-valuenow={cleanPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Clean meter"
            >
              <div
                className="h-full rounded-full transition-[width] duration-150"
                style={{
                  width: `${cleanPct}%`,
                  background:
                    cleanPct >= 60
                      ? "linear-gradient(90deg,#5B8DA8,#7EC8D9)"
                      : cleanPct >= 30
                        ? "linear-gradient(90deg,#c4a35a,#D94F9C)"
                        : "linear-gradient(90deg,#D94F9C,#7a2048)",
                }}
              />
            </div>
            <p
              className={`text-[11px] font-medium tracking-wide text-[#7EC8D9] transition-transform ${flashStreak ? "scale-110" : ""}`}
            >
              {hud.streakLabel}
            </p>
          </div>
        </div>

        <canvas ref={canvasRef} className="block w-full touch-none" />

        {phase === "countdown" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <p className="seeds-holo-text mb-2 text-xs uppercase tracking-[0.35em]">Clean Sneaks</p>
            <p className="mb-6 text-sm text-[#7EC8D9]">100% CLEAN</p>
            <p className="text-6xl font-bold tabular-nums text-foreground sm:text-7xl">
              {countdown > 0 ? countdown : "RUN."}
            </p>
          </div>
        )}

        {phase === "over" && gameOver && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 px-4 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#5B8DA8]">Clean Sneaks</p>
            <h3 className="seeds-holo-text mt-2 text-3xl font-bold tracking-wide sm:text-4xl">
              KICKS COOKED.
            </h3>
            <dl className="mt-6 grid w-full max-w-sm grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Distance</dt>
                <dd className="font-semibold tabular-nums">{gameOver.distance}m</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Final clean</dt>
                <dd className="font-semibold tabular-nums">{gameOver.finalCleanliness}%</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Clean streak</dt>
                <dd className="font-semibold">{gameOver.streakLabel}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Score</dt>
                <dd className="font-semibold tabular-nums text-[#7EC8D9]">
                  {gameOver.score.toLocaleString()}
                </dd>
              </div>
              <div className="col-span-2 border-t border-white/10 pt-3">
                <dt className="text-muted-foreground">Best score</dt>
                <dd className="text-lg font-bold tabular-nums">
                  {gameOver.bestScore.toLocaleString()}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-[#5B8DA8] text-white"
                onClick={runItBack}
                data-testid="button-clean-sneaks-retry"
              >
                Run It Back
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onShare}
                data-testid="button-clean-sneaks-share"
              >
                Share Score
              </Button>
              {onExit && (
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={onExit}
                  data-testid="button-clean-sneaks-exit"
                >
                  Close
                </Button>
              )}
            </div>
            {shareMsg && <p className="mt-3 text-xs text-muted-foreground">{shareMsg}</p>}
          </div>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-muted-foreground sm:text-xs">
        Desktop: A/D or ←/→ dodge · Space/↑ jump · Mobile: swipe left/right/up
      </p>
    </div>
  );
}
