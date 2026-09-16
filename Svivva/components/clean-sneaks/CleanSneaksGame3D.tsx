"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { cleanLabelFrom, resolvePlayerSneaker, streakLabelFrom } from "@/lib/clean-sneaks/assets";
import {
  activateSneakVision,
  buildGameOverPayload,
  createRunEngineState,
  cycleWalkStyle,
  FINISH_DISTANCE,
  jumpRun,
  shiftLane,
  snapshotShoes,
  tryOhNoAction,
  type RunEngineState,
} from "@/lib/clean-sneaks/run-engine";
import { readBestScore, shareScore, writeBestScore } from "@/lib/clean-sneaks/storage";
import type {
  GameOverPayload,
  GamePhase,
  HudShoeSnapshot,
  RunStats,
  SneakerAssetRef,
} from "@/lib/clean-sneaks/types";
import { isPortraitViewport } from "@/lib/clean-sneaks/run-quality";
import { WEATHER, type OhNoAction } from "@/lib/clean-sneaks/contact-map";
import {
  readSavedColorway,
  writeSavedColorway,
  type Baloon8ColorwayId,
} from "@/lib/clean-sneaks/sneaker-catalog";
import { preloadMainGameCover } from "./GameStartScreen";
import { ShoeCamHud } from "./ShoeCamHud";
import { PostMissionReveal } from "./PostMissionReveal";
import { CleanPathHud, OhNoOverlay } from "./OhNoOverlay";
import { Baloon8ColorwayPicker } from "./Baloon8ColorwayPicker";

const CleanSneaksRunScene = dynamic(
  () => import("./CleanSneaksRunScene").then((m) => ({ default: m.CleanSneaksRunScene })),
  { ssr: false, loading: () => null },
);

export type CleanSneaksGame3DProps = {
  active: boolean;
  onExit?: () => void;
  onStats?: (stats: RunStats) => void;
  onPhaseChange?: (phase: GamePhase) => void;
  onRegisterBegin?: (begin: () => void) => void;
  sneakerOverride?: Partial<SneakerAssetRef> | null;
  fullscreen?: boolean;
  className?: string;
  style?: CSSProperties;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function emptyShoeSnap(side: "left" | "right"): HudShoeSnapshot {
  const zones = {
    toeBox: { amount: 0, wetness: 0, color: null },
    leftSide: { amount: 0, wetness: 0, color: null },
    rightSide: { amount: 0, wetness: 0, color: null },
    heel: { amount: 0, wetness: 0, color: null },
    tongue: { amount: 0, wetness: 0, color: null },
    laces: { amount: 0, wetness: 0, color: null },
    midsole: { amount: 0, wetness: 0, color: null },
    outsole: { amount: 0, wetness: 0, color: null },
  };
  return { side, cleanliness: 100, zones, creases: 0, scuffs: 0 };
}

function statsFromState(s: RunEngineState): RunStats {
  const now = performance.now();
  const pair = snapshotShoes(s);
  return {
    score: Math.floor(s.score),
    distance: Math.floor(s.distance),
    cleanliness: Math.max(0, Math.floor(s.cleanliness)),
    leftClean: Math.floor(pair.left.cleanliness),
    rightClean: Math.floor(pair.right.cleanliness),
    cleanLabel: cleanLabelFrom(s.cleanliness),
    streak: s.streak,
    streakLabel: streakLabelFrom(s.streak),
    bestScore: s.best,
    closeCalls: s.closeCalls,
    styleScore: Math.floor(s.styleScore),
    creases: Math.floor((s.left.creases + s.right.creases) / 2),
    weather: s.weather,
    walkStyle: s.walkStyle,
    sneakVisionActive: now < s.sneakVisionUntil,
    cleanChain: s.cleanChain,
  };
}

export function CleanSneaksGame3D({
  active,
  onExit,
  onStats,
  onPhaseChange,
  onRegisterBegin,
  sneakerOverride,
  fullscreen = false,
  className,
  style,
}: CleanSneaksGame3DProps) {
  const [colorwayId, setColorwayId] = useState<Baloon8ColorwayId>(() =>
    typeof window === "undefined" ? "oilSlick" : readSavedColorway(),
  );
  const sneaker = resolvePlayerSneaker({
    ...sneakerOverride,
    archetype: sneakerOverride?.archetype ?? colorwayId,
  });
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<RunEngineState>(createRunEngineState(0, sneaker.archetype ?? colorwayId));
  const loadingDoneRef = useRef(false);

  const [phase, setPhase] = useState<GamePhase>("loading");
  const [countdown, setCountdown] = useState(3);
  const [hud, setHud] = useState<RunStats>(() => statsFromState(stateRef.current));
  const [shoes, setShoes] = useState(() => ({
    left: emptyShoeSnap("left"),
    right: emptyShoeSnap("right"),
  }));
  const [gameOver, setGameOver] = useState<GameOverPayload | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [flashStreak, setFlashStreak] = useState(false);
  const [sceneKey, setSceneKey] = useState(0);
  const [popups, setPopups] = useState<{ text: string; life: number; color: string }[]>([]);
  const [portrait, setPortrait] = useState(false);
  const [ohNoTick, setOhNoTick] = useState(0);
  const [pathOpts, setPathOpts] = useState(stateRef.current.paths);
  const [npcLine, setNpcLine] = useState<string | null>(null);
  const [ohNo, setOhNo] = useState(stateRef.current.ohNo);

  const emitStats = useCallback(() => {
    const s = stateRef.current;
    const leftRight = snapshotShoes(s);
    const stats = statsFromState(s);
    setHud(stats);
    setShoes(leftRight);
    setPopups([...s.popups]);
    setPathOpts(s.paths ? [...s.paths] : null);
    setNpcLine(s.npcLine);
    setOhNo(s.ohNo ? { ...s.ohNo } : null);
    if (s.ohNo?.active) setOhNoTick((n) => n + 1);
    onStats?.(stats);
  }, [onStats]);

  const resetRun = useCallback(() => {
    stateRef.current = createRunEngineState(readBestScore(), sneaker.archetype ?? colorwayId);
    setGameOver(null);
    setShareMsg(null);
    setSceneKey((k) => k + 1);
    emitStats();
  }, [emitStats, sneaker.archetype, colorwayId]);

  const selectColorway = useCallback(
    (id: Baloon8ColorwayId) => {
      if (phase === "running") return;
      setColorwayId(id);
      writeSavedColorway(id);
    },
    [phase],
  );

  const endRun = useCallback(() => {
    const s = stateRef.current;
    if (!s.running && phase === "over") return;
    s.running = false;
    const best = writeBestScore(s.score);
    s.best = best;
    const payload = buildGameOverPayload(s, best, { cleanLabelFrom, streakLabelFrom });
    setGameOver(payload);
    setPhase("over");
    emitStats();
  }, [emitStats, phase]);

  const handleStreakFlash = useCallback(() => {
    setFlashStreak(true);
    window.setTimeout(() => setFlashStreak(false), 450);
  }, []);

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  useEffect(() => {
    const syncViewport = () => setPortrait(isPortraitViewport());
    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
    };
  }, []);

  const startCountdown = useCallback(() => {
    setPhase("countdown");
    setCountdown(3);
    let n = 3;
    const reduced = prefersReducedMotion();
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
      reduced ? 280 : 520,
    );
    return id;
  }, []);

  const finishLoading = useCallback(() => {
    if (loadingDoneRef.current) return;
    loadingDoneRef.current = true;
    setPhase("start");
  }, []);

  const beginGame = useCallback(() => {
    startCountdown();
  }, [startCountdown]);

  useEffect(() => {
    onRegisterBegin?.(beginGame);
  }, [beginGame, onRegisterBegin]);

  useEffect(() => {
    if (!active) return;
    resetRun();
    loadingDoneRef.current = false;
    setPhase("loading");
    setCountdown(3);
  }, [active, resetRun]);

  const onOhNo = useCallback(
    (action: OhNoAction) => {
      tryOhNoAction(stateRef.current, action, performance.now());
      emitStats();
    },
    [emitStats],
  );

  useEffect(() => {
    if (!active || phase !== "loading") return;
    void import("./CleanSneaksRunScene");

    let cancelled = false;
    let delayId = 0;
    const reduced = prefersReducedMotion();
    const minMs = reduced ? 1400 : 2800;
    const started = performance.now();
    const maxId = window.setTimeout(finishLoading, minMs + 6000);

    const finishWhenReady = () => {
      if (cancelled || loadingDoneRef.current) return;
      const wait = Math.max(0, minMs - (performance.now() - started));
      delayId = window.setTimeout(finishLoading, wait);
    };

    void preloadMainGameCover().then(finishWhenReady);

    return () => {
      cancelled = true;
      window.clearTimeout(maxId);
      window.clearTimeout(delayId);
    };
  }, [active, phase, finishLoading]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (phase === "over" || phase === "loading") return;
      const k = e.key.toLowerCase();
      if (phase === "start") {
        if (k === " " || k === "enter" || e.code === "Space") {
          e.preventDefault();
          beginGame();
        }
        return;
      }
      const s = stateRef.current;
      const now = performance.now();

      // Oh No reaction keys
      if (s.ohNo?.active && !s.ohNo.resolved) {
        const map: Record<string, OhNoAction> = {
          "1": "liftFoot",
          "2": "twist",
          "3": "hop",
          "4": "kickAway",
          "5": "sacrificeOther",
          "6": "block",
        };
        if (map[k]) {
          e.preventDefault();
          onOhNo(map[k]!);
          return;
        }
      }

      if (
        ["arrowleft", "a", "arrowright", "d", " ", "arrowup", "w", "v", "c", "e"].includes(k) ||
        e.code === "Space"
      ) {
        e.preventDefault();
      }
      if (k === "arrowleft" || k === "a") shiftLane(s, -1);
      else if (k === "arrowright" || k === "d") shiftLane(s, 1);
      else if (k === " " || k === "arrowup" || k === "w" || e.code === "Space") jumpRun(s);
      else if (k === "v") activateSneakVision(s, now);
      else if (k === "c") cycleWalkStyle(s);
      else if (k === "e") {
        // Quick path refresh via sneak vision
        activateSneakVision(s, now);
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [active, phase, beginGame, onOhNo]);

  useEffect(() => {
    if (!active || phase !== "running") return;
    const el = wrapRef.current;
    if (!el) return;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      (el as HTMLDivElement & { _touch?: { x: number; y: number } })._touch = {
        x: e.touches[0]!.clientX,
        y: e.touches[0]!.clientY,
      };
    };
    const onMove = (e: TouchEvent) => {
      if (phase === "running") e.preventDefault();
    };
    const onEnd = (e: TouchEvent) => {
      const start = (el as HTMLDivElement & { _touch?: { x: number; y: number } })._touch;
      (el as HTMLDivElement & { _touch?: { x: number; y: number } })._touch = undefined;
      if (!start || !e.changedTouches[0]) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
        // Tap = sneak vision
        activateSneakVision(stateRef.current, performance.now());
        return;
      }
      if (Math.abs(dy) > Math.abs(dx) && dy < -28) jumpRun(stateRef.current);
      else if (Math.abs(dx) > 28) {
        if (dx < 0) shiftLane(stateRef.current, -1);
        else shiftLane(stateRef.current, 1);
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

  // Keep Oh No timer bar updating
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => {
      if (stateRef.current.ohNo?.active) setOhNoTick((n) => n + 1);
    }, 50);
    return () => window.clearInterval(id);
  }, [phase]);

  const runItBack = () => {
    resetRun();
    loadingDoneRef.current = false;
    setPhase("loading");
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

  const weatherLabel = WEATHER[hud.weather].label;
  const visionOn = hud.sneakVisionActive;
  void ohNoTick;

  if (phase === "loading" || phase === "start") {
    return null;
  }

  return (
    <div
      ref={wrapRef}
      className={`flex min-h-0 flex-col ${fullscreen ? "h-full flex-1" : ""} ${className ?? ""}`}
      style={style}
      role="application"
      aria-label="Clean Sneaks 3D game"
    >
      <div
        className={`relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0a0c10]/85 ${
          fullscreen ? "rounded-lg border border-white/10" : "rounded-xl border border-white/10"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 ${
            portrait ? "px-2 py-1.5" : "p-3 sm:p-4"
          }`}
        >
          <div className={portrait ? "space-y-0" : "space-y-1"}>
            {!portrait && (
              <p className="text-[10px] uppercase tracking-[0.25em] text-[#5B8DA8]/80">
                {sneaker.label ?? "Walkers"} · How clean can you keep the fit?
              </p>
            )}
            <p
              className={`font-bold tabular-nums text-foreground ${portrait ? "text-base" : "text-lg sm:text-xl"}`}
            >
              {hud.score.toLocaleString()}
            </p>
            {!portrait && (
              <p className="text-xs text-muted-foreground">
                {hud.distance}m · L {hud.leftClean}% · R {hud.rightClean}% · Best{" "}
                {hud.bestScore.toLocaleString()}
              </p>
            )}
            {!portrait && (
              <p className="text-[10px] uppercase tracking-wider text-white/40">
                {weatherLabel} · {hud.walkStyle} · chain x{hud.cleanChain}
                {visionOn ? " · SNEAK VISION" : ""}
              </p>
            )}
          </div>
          <div
            className={`space-y-1 text-right ${portrait ? "min-w-[110px] max-w-[150px]" : "min-w-[140px] max-w-[200px] flex-1"}`}
          >
            <div className="flex items-center justify-end gap-1.5">
              <span
                className={`font-semibold uppercase tracking-wider ${cleanTone} ${portrait ? "text-[10px]" : "text-xs"}`}
              >
                {hud.cleanLabel}
              </span>
              <span
                className={`font-bold tabular-nums ${cleanTone} ${portrait ? "text-xs" : "text-sm"}`}
                aria-live="polite"
              >
                {cleanPct}%
              </span>
            </div>
            {!portrait && (
              <p
                className={`text-[11px] font-medium tracking-wide text-[#7EC8D9] transition-transform ${flashStreak ? "scale-110" : ""}`}
              >
                {hud.streakLabel} · {hud.closeCalls} close calls
              </p>
            )}
          </div>
        </div>

        <div
          className={`pointer-events-none absolute z-10 ${portrait ? "bottom-16 left-2" : "bottom-24 left-3"}`}
        >
          <ShoeCamHud left={shoes.left} right={shoes.right} compact={portrait} />
        </div>

        <div
          className={`relative w-full ${fullscreen ? "min-h-0 flex-1" : "h-[420px] sm:h-[480px]"}`}
          style={fullscreen && !portrait ? { minHeight: "min(60vh, 640px)" } : undefined}
        >
          <CleanSneaksRunScene
            key={`${sceneKey}-${colorwayId}`}
            stateRef={stateRef}
            running={phase === "running"}
            onGameOver={endRun}
            onStreakFlash={handleStreakFlash}
            onStatsTick={emitStats}
            colorwayId={colorwayId}
            className="absolute inset-0"
          />

          {popups.length > 0 && (
            <div className="pointer-events-none absolute bottom-28 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
              {popups.slice(-3).map((p, i) => (
                <span
                  key={`${p.text}-${i}`}
                  className="text-sm font-bold drop-shadow-md"
                  style={{ color: p.color, opacity: Math.max(0, p.life) }}
                >
                  {p.text}
                </span>
              ))}
            </div>
          )}

          {pathOpts && phase === "running" && <CleanPathHud paths={pathOpts} />}

          {npcLine && phase === "running" && (
            <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-[#e8e8ec]">
              “{npcLine}”
            </div>
          )}

          {ohNo && phase === "running" && <OhNoOverlay window={ohNo} onAction={onOhNo} />}
        </div>

        {phase === "running" && (
          <div className="pointer-events-auto absolute bottom-3 right-3 z-20 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-white/20 bg-black/50 text-[10px] uppercase tracking-wider"
              onClick={() => activateSneakVision(stateRef.current, performance.now())}
              data-testid="button-sneak-vision"
            >
              Vision (V)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 border-white/20 bg-black/50 text-[10px] uppercase tracking-wider"
              onClick={() => cycleWalkStyle(stateRef.current)}
              data-testid="button-walk-style"
            >
              Walk (C)
            </Button>
          </div>
        )}

        {phase === "countdown" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <p className="seeds-holo-text mb-2 text-xs uppercase tracking-[0.35em]">Clean Sneaks</p>
            <p className="mb-1 text-sm text-[#7EC8D9]">
              {sneaker.label ?? "BALOON8"} · Keep the fit clean
            </p>
            <div className="mb-4 w-full max-w-md rounded-lg border border-white/10 bg-black/50 p-3">
              <Baloon8ColorwayPicker value={colorwayId} onChange={selectColorway} compact />
            </div>
            <p className="mb-2 max-w-xs text-center text-[11px] text-white/50">
              Look at the ground. V = Sneak Vision · C = walk style · 1–6 = Oh No saves
            </p>
            <p className="mb-6 text-sm text-[#7EC8D9]/80">
              100% CLEAN · TWO SHOES · {FINISH_DISTANCE}m destination
            </p>
            <p className="text-6xl font-bold tabular-nums text-foreground sm:text-7xl">
              {countdown > 0 ? countdown : "RUN."}
            </p>
          </div>
        )}

        {phase === "over" && gameOver && (
          <PostMissionReveal
            payload={gameOver}
            onRetry={runItBack}
            onShare={onShare}
            onExit={onExit}
            shareMsg={shareMsg}
          />
        )}
      </div>

      {!fullscreen && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground sm:text-xs">
          A/D dodge · Space jump · V Sneak Vision · C walk style · Mobile: swipe / tap vision
        </p>
      )}
    </div>
  );
}
