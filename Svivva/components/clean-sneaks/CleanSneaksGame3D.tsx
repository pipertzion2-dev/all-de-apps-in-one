"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { cleanLabelFrom, resolvePlayerSneaker, streakLabelFrom } from "@/lib/clean-sneaks/assets";
import {
  createRunEngineState,
  jumpRun,
  shiftLane,
  type RunEngineState,
} from "@/lib/clean-sneaks/run-engine";
import { readBestScore, shareScore, writeBestScore } from "@/lib/clean-sneaks/storage";
import type { GameOverPayload, RunStats, SneakerAssetRef } from "@/lib/clean-sneaks/types";
import { isPortraitViewport } from "@/lib/clean-sneaks/run-quality";
import { GameLogoSplash } from "./GameLogoSplash";
import { CleanSneaksRunScene } from "./CleanSneaksRunScene";

export type CleanSneaksGame3DProps = {
  active: boolean;
  onExit?: () => void;
  onStats?: (stats: RunStats) => void;
  sneakerOverride?: Partial<SneakerAssetRef> | null;
  fullscreen?: boolean;
  className?: string;
  style?: CSSProperties;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function CleanSneaksGame3D({
  active,
  onExit,
  onStats,
  sneakerOverride,
  fullscreen = false,
  className,
  style,
}: CleanSneaksGame3DProps) {
  const sneaker = resolvePlayerSneaker(sneakerOverride);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<RunEngineState>(createRunEngineState());
  const logoSkipRef = useRef(false);

  const [phase, setPhase] = useState<"logo" | "countdown" | "running" | "over">("logo");
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
  const [sceneKey, setSceneKey] = useState(0);
  const [popups, setPopups] = useState<{ text: string; life: number; color: string }[]>([]);
  const [portrait, setPortrait] = useState(false);

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
    setPopups([...s.popups]);
    onStats?.(stats);
  }, [onStats]);

  const resetRun = useCallback(() => {
    stateRef.current = createRunEngineState(readBestScore());
    setGameOver(null);
    setShareMsg(null);
    setSceneKey((k) => k + 1);
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

  const handleStreakFlash = useCallback(() => {
    setFlashStreak(true);
    window.setTimeout(() => setFlashStreak(false), 450);
  }, []);

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

  const dismissLogo = useCallback(() => {
    if (logoSkipRef.current) return;
    logoSkipRef.current = true;
    startCountdown();
  }, [startCountdown]);

  useEffect(() => {
    if (!active) return;
    resetRun();
    logoSkipRef.current = false;
    setPhase("logo");
    setCountdown(3);
  }, [active, resetRun]);

  useEffect(() => {
    if (!active || phase !== "logo") return;
    const reduced = prefersReducedMotion();
    const autoId = window.setTimeout(dismissLogo, reduced ? 1200 : 2400);
    return () => window.clearTimeout(autoId);
  }, [active, phase, dismissLogo]);

  useEffect(() => {
    if (!active || phase !== "logo") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.code === "Space") {
        e.preventDefault();
        dismissLogo();
      }
    };
    window.addEventListener("keydown", onKey, { passive: false });
    return () => window.removeEventListener("keydown", onKey);
  }, [active, phase, dismissLogo]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (phase === "over") return;
      const k = e.key.toLowerCase();
      if (
        ["arrowleft", "a", "arrowright", "d", " ", "arrowup", "w"].includes(k) ||
        e.code === "Space"
      ) {
        e.preventDefault();
      }
      if (k === "arrowleft" || k === "a") shiftLane(stateRef.current, -1);
      else if (k === "arrowright" || k === "d") shiftLane(stateRef.current, 1);
      else if (k === " " || k === "arrowup" || k === "w" || e.code === "Space")
        jumpRun(stateRef.current);
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
      if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
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

  const runItBack = () => {
    resetRun();
    logoSkipRef.current = true;
    startCountdown();
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
                {sneaker.label ?? "Walkers"} · 3D Run
              </p>
            )}
            <p
              className={`font-bold tabular-nums text-foreground ${portrait ? "text-base" : "text-lg sm:text-xl"}`}
            >
              {hud.score.toLocaleString()}
            </p>
            {!portrait && (
              <p className="text-xs text-muted-foreground">
                {hud.distance}m · Best {hud.bestScore.toLocaleString()}
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
            <div
              className={`overflow-hidden rounded-full bg-white/10 ${portrait ? "h-1.5" : "h-2"}`}
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
            {!portrait && (
              <p
                className={`text-[11px] font-medium tracking-wide text-[#7EC8D9] transition-transform ${flashStreak ? "scale-110" : ""}`}
              >
                {hud.streakLabel}
              </p>
            )}
          </div>
        </div>

        <div
          className={`relative w-full ${fullscreen ? "min-h-0 flex-1" : "h-[420px] sm:h-[480px]"}`}
          style={fullscreen && !portrait ? { minHeight: "min(60vh, 640px)" } : undefined}
        >
          <CleanSneaksRunScene
            key={sceneKey}
            stateRef={stateRef}
            running={phase === "running"}
            onGameOver={endRun}
            onStreakFlash={handleStreakFlash}
            onStatsTick={emitStats}
            className="absolute inset-0"
          />

          {popups.length > 0 && (
            <div className="pointer-events-none absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1">
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
        </div>

        {phase === "logo" && (
          <GameLogoSplash
            className="fixed inset-0 z-[300] cursor-pointer"
            showHint
            onContinue={dismissLogo}
          />
        )}

        {phase === "countdown" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
            <p className="seeds-holo-text mb-2 text-xs uppercase tracking-[0.35em]">Clean Sneaks</p>
            <p className="mb-2 text-sm text-[#7EC8D9]">Baloon8 Blueprint · 3D Run</p>
            <p className="mb-6 text-sm text-[#7EC8D9]/80">100% CLEAN</p>
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

      {!fullscreen && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground sm:text-xs">
          Desktop: A/D or ←/→ dodge · Space/↑ jump · Mobile: swipe left/right/up
        </p>
      )}
    </div>
  );
}
