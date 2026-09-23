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
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";
import {
  evaluateBundleUnlock,
  isBundleCardUnlocked,
  markBundleCardUnlocked,
} from "@/lib/clean-sneaks/bundle-unlock";
import {
  playCue,
  saveWalkingScoreToSession,
  canAffordTable,
  scoreToCredits,
  CREDITS_MIN_ANTE,
} from "@/lib/clean-sneaks/casino";
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
import { CasinoEntryRules } from "./CasinoEntryRules";
import { GameInterstitialAd, GameRewardedAd } from "./ads";
import { RewardClaimModal } from "./monetization/RewardClaimModal";
import {
  addPassXpForWalk,
  buildRewardedOffer,
  readWallet,
  writeWallet,
  type RewardedOffer,
} from "@/lib/clean-sneaks/monetization";

const CleanSneaksRunScene = dynamic(
  () => import("./CleanSneaksRunScene").then((m) => ({ default: m.CleanSneaksRunScene })),
  { ssr: false, loading: () => null },
);

const CasinoExperience = dynamic(
  () => import("./casino/CasinoExperience").then((m) => ({ default: m.CasinoExperience })),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-1 items-center justify-center bg-[#07050a] text-[#d4af37]">
        Opening casino…
      </div>
    ),
  },
);

export type CleanSneaksGame3DProps = {
  active: boolean;
  onExit?: () => void;
  onStats?: (stats: RunStats) => void;
  onPhaseChange?: (phase: GamePhase) => void;
  onRegisterBegin?: (begin: () => void) => void;
  onPlayBundleCard?: () => void;
  sneakerOverride?: Partial<SneakerAssetRef> | null;
  fullscreen?: boolean;
  className?: string;
  style?: CSSProperties;
  /**
   * When the page already advanced past the Karen splash, skip the internal
   * loading timer so we do not fight the page-owned intro and never pull the
   * RunScene chunk until the player taps Start.
   */
  skipIntroLoading?: boolean;
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
  onPlayBundleCard,
  sneakerOverride,
  fullscreen = false,
  className,
  style,
  skipIntroLoading = false,
}: CleanSneaksGame3DProps) {
  const [colorwayId, setColorwayId] = useState<Baloon8ColorwayId>(() =>
    typeof window === "undefined" ? "oilSlick" : readSavedColorway(),
  );
  const colorwayIdRef = useRef(colorwayId);
  colorwayIdRef.current = colorwayId;
  const sneaker = resolvePlayerSneaker({
    ...sneakerOverride,
    archetype: sneakerOverride?.archetype ?? colorwayId,
  });
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<RunEngineState>(createRunEngineState(0, sneaker.archetype ?? colorwayId));
  const loadingDoneRef = useRef(skipIntroLoading);
  /** Cover "Start" tapped — never return to loading/start splash this session. */
  const coverStartPassedRef = useRef(false);
  const sessionBootedRef = useRef(false);

  const [phase, setPhase] = useState<GamePhase>(() => (skipIntroLoading ? "start" : "loading"));
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
  const [colorwayChosen, setColorwayChosen] = useState(false);
  const [walkCompleteScore, setWalkCompleteScore] = useState(0);
  const [rewardedOpen, setRewardedOpen] = useState(false);
  const [missionOffer, setMissionOffer] = useState<RewardedOffer | null>(null);
  const [missionRewardOpen, setMissionRewardOpen] = useState(false);
  const [interstitialOpen, setInterstitialOpen] = useState(false);
  const interstitialResumeRef = useRef<(() => void) | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const destinationCelebratedRef = useRef(false);

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

  const resetRun = useCallback(
    (archetype?: Baloon8ColorwayId) => {
      const id = archetype ?? colorwayIdRef.current;
      stateRef.current = createRunEngineState(readBestScore(), id);
      destinationCelebratedRef.current = false;
      setGameOver(null);
      setShareMsg(null);
      setSceneKey((k) => k + 1);
      emitStats();
    },
    [emitStats],
  );

  const selectColorway = useCallback(
    (id: Baloon8ColorwayId) => {
      if (phase === "running") return;
      setColorwayId(id);
      writeSavedColorway(id);
      setColorwayChosen(true);
      stateRef.current.archetypeId = id;
    },
    [phase],
  );

  const finalizeScoreAndUnlock = useCallback(() => {
    const s = stateRef.current;
    const previousBest = readBestScore();
    const best = writeBestScore(s.score);
    s.best = best;
    const payload = buildGameOverPayload(s, best, { cleanLabelFrom, streakLabelFrom });
    const alreadyUnlocked = isBundleCardUnlocked();
    const unlockEval = evaluateBundleUnlock({
      score: payload.score,
      distance: payload.distance,
      previousBest,
    });
    if (unlockEval.unlocked) markBundleCardUnlocked();
    payload.bundleCardUnlocked = alreadyUnlocked || unlockEval.unlocked;
    payload.bundleNewlyUnlocked = !alreadyUnlocked && unlockEval.unlocked;
    payload.bundleUnlockReason = payload.bundleCardUnlocked ? undefined : unlockEval.reason;
    saveWalkingScoreToSession(payload.score, payload.distance, payload.bundleCardUnlocked);
    const wallet = readWallet();
    writeWallet({
      ...wallet,
      credits: Math.max(wallet.credits, Math.floor(payload.score)),
      walksCompleted: wallet.walksCompleted + 1,
    });
    addPassXpForWalk();
    const offer = buildRewardedOffer({
      context: "mission_complete",
      baseCredits: Math.floor(payload.score),
      walkId: `walk-${Date.now()}`,
    });
    if (offer) {
      setMissionOffer(offer);
      setMissionRewardOpen(true);
    }
    return payload;
  }, []);

  const enterCasino = useCallback(() => {
    const go = () => {
      const s = stateRef.current;
      s.running = false;
      const payload = finalizeScoreAndUnlock();
      setWalkCompleteScore(payload.score);
      setGameOver(payload);
      setPhase("casino");
      playCue("walking_complete");
    };
    interstitialResumeRef.current = go;
    setInterstitialOpen(true);
  }, [finalizeScoreAndUnlock]);

  /** Cash out whatever score you've earned so far and jump to Steal the Bundle. */
  const cashOutToBundle = useCallback(() => {
    const s = stateRef.current;
    const credits = scoreToCredits(s.score);
    if (!canAffordTable(credits)) return;
    const go = () => {
      s.running = false;
      const payload = finalizeScoreAndUnlock();
      setWalkCompleteScore(payload.score);
      setGameOver(payload);
      saveWalkingScoreToSession(payload.score, payload.distance, true);
      setPhase("casino");
      playCue("walking_complete");
    };
    interstitialResumeRef.current = go;
    setInterstitialOpen(true);
  }, [finalizeScoreAndUnlock]);

  const endRun = useCallback(() => {
    const s = stateRef.current;
    if (!s.running && (phase === "over" || phase === "casino" || phase === "walkComplete")) return;
    s.running = false;
    const payload = finalizeScoreAndUnlock();
    setGameOver(payload);
    setWalkCompleteScore(payload.score);
    // Destination finish → casino reward path; cooked early → classic reveal.
    if (s.destinationReached || payload.bundleCardUnlocked) {
      setPhase("walkComplete");
      playCue("walking_complete");
    } else {
      setPhase("over");
    }
    emitStats();
  }, [emitStats, phase, finalizeScoreAndUnlock]);

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
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    const pickedColorway = colorwayIdRef.current;
    writeSavedColorway(pickedColorway);
    stateRef.current = createRunEngineState(readBestScore(), pickedColorway);
    emitStats();
    setPhase("countdown");
    setCountdown(3);
    let n = 3;
    const reduced = prefersReducedMotion();
    const timerId = window.setInterval(
      () => {
        n -= 1;
        if (n > 0) setCountdown(n);
        else if (n === 0) setCountdown(0);
        else {
          window.clearInterval(timerId);
          countdownTimerRef.current = null;
          setPhase("running");
          stateRef.current.running = true;
          stateRef.current.lastTs = performance.now();
        }
      },
      reduced ? 280 : 520,
    );
    countdownTimerRef.current = timerId;
  }, [emitStats]);

  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const confirmColorwayAndCountdown = useCallback(() => {
    const id = colorwayIdRef.current;
    stateRef.current.archetypeId = id;
    writeSavedColorway(id);
    setColorwayChosen(true);
    startCountdown();
  }, [startCountdown]);

  const finishLoading = useCallback(() => {
    if (loadingDoneRef.current) return;
    loadingDoneRef.current = true;
    setPhase((p) => {
      if (
        p === "colorPick" ||
        p === "countdown" ||
        p === "running" ||
        p === "paused" ||
        p === "over" ||
        p === "walkComplete" ||
        p === "casino"
      )
        return p;
      if (coverStartPassedRef.current) return "colorPick";
      return "start";
    });
  }, []);

  const beginGame = useCallback(() => {
    coverStartPassedRef.current = true;
    setColorwayChosen(false);
    setCountdown(3);
    setPhase("colorPick");
  }, []);

  useEffect(() => {
    onRegisterBegin?.(beginGame);
  }, [beginGame, onRegisterBegin]);

  useEffect(() => {
    if (!active) {
      sessionBootedRef.current = false;
      coverStartPassedRef.current = false;
      loadingDoneRef.current = false;
      return;
    }
    if (sessionBootedRef.current) return;
    sessionBootedRef.current = true;
    const saved = readSavedColorway();
    resetRun(saved);
    loadingDoneRef.current = false;
    if (skipIntroLoading || coverStartPassedRef.current) {
      loadingDoneRef.current = true;
      setPhase(coverStartPassedRef.current ? "colorPick" : "start");
    } else {
      setPhase("loading");
    }
    setCountdown(3);
  }, [active, resetRun, skipIntroLoading]);

  const onOhNo = useCallback(
    (action: OhNoAction) => {
      tryOhNoAction(stateRef.current, action, performance.now());
      emitStats();
    },
    [emitStats],
  );

  useEffect(() => {
    if (!active || phase !== "loading") return;
    // Do NOT preload CleanSneaksRunScene here — parsing that chunk on mobile
    // Safari freezes the Karen splash (CSS spins stop, UI unresponsive).

    let cancelled = false;
    let delayId = 0;
    const reduced = prefersReducedMotion();
    const minMs = reduced ? 1200 : 2400;
    const started = performance.now();
    const maxId = window.setTimeout(finishLoading, minMs + 4000);

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

  const pauseRun = useCallback(() => {
    if (phase !== "running") return;
    stateRef.current.running = false;
    setPhase("paused");
  }, [phase]);

  const resumeRun = useCallback(() => {
    if (phase !== "paused") return;
    stateRef.current.running = true;
    stateRef.current.lastTs = performance.now();
    setPhase("running");
  }, [phase]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (phase === "over" || phase === "loading" || phase === "walkComplete" || phase === "casino")
        return;
      const k = e.key.toLowerCase();
      if (phase === "paused") {
        if (k === "escape" || k === "p" || k === " " || k === "enter" || e.code === "Space") {
          e.preventDefault();
          resumeRun();
        }
        return;
      }
      if (phase === "running" && (k === "escape" || k === "p")) {
        e.preventDefault();
        pauseRun();
        return;
      }
      if (phase === "start") {
        if (k === " " || k === "enter" || e.code === "Space") {
          e.preventDefault();
          beginGame();
        }
        return;
      }
      if (phase === "colorPick") {
        if (k === " " || k === "enter" || e.code === "Space") {
          e.preventDefault();
          confirmColorwayAndCountdown();
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
  }, [active, phase, beginGame, confirmColorwayAndCountdown, onOhNo, pauseRun, resumeRun]);

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
    destinationCelebratedRef.current = false;
    resetRun();
    setColorwayChosen(false);
    setCountdown(3);
    setPhase("colorPick");
  };

  const continueBonus = () => {
    const s = stateRef.current;
    s.running = true;
    s.lastTs = performance.now();
    setPhase("running");
  };

  const onDestination = useCallback(() => {
    emitStats();
    if (destinationCelebratedRef.current) return;
    destinationCelebratedRef.current = true;
    const s = stateRef.current;
    s.running = false;
    const payload = finalizeScoreAndUnlock();
    setWalkCompleteScore(payload.score);
    setGameOver(payload);
    setPhase("walkComplete");
    playCue("walking_complete");
  }, [emitStats, finalizeScoreAndUnlock]);

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

  if (phase === "casino") {
    return (
      <div
        className={`flex min-h-0 flex-col ${fullscreen ? "h-full flex-1" : ""} ${className ?? ""}`}
        style={style}
        role="application"
        aria-label={`${KLEAN_SNEAKS.title} casino`}
      >
        <CasinoExperience
          walkingScore={walkCompleteScore || gameOver?.score || 0}
          initialState="WALK_COMPLETE"
          onNewWalk={runItBack}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`flex min-h-0 flex-col ${fullscreen ? "h-full flex-1" : ""} ${className ?? ""}`}
      style={style}
      role="application"
      aria-label={`${KLEAN_SNEAKS.title} 3D game`}
    >
      <div
        className={`relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#0a0c10]/85 ${
          fullscreen ? "rounded-lg border border-white/10" : "rounded-xl border border-white/10"
        }`}
      >
        {(phase === "running" || phase === "paused") && (
          <div
            className={`pointer-events-auto absolute z-20 flex gap-2 ${
              portrait ? "right-2 top-2" : "right-3 top-3"
            }`}
          >
            {phase === "running" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`border-white/20 bg-black/55 text-[10px] uppercase tracking-wider ${
                  portrait ? "h-7 px-2" : ""
                }`}
                onClick={pauseRun}
                data-testid="button-run-pause"
              >
                Pause
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className={`bg-[#d4af37] text-[10px] uppercase tracking-wider text-[#1a1008] ${
                  portrait ? "h-7 px-2" : ""
                }`}
                onClick={resumeRun}
                data-testid="button-run-resume-top"
              >
                Resume
              </Button>
            )}
            {onExit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={`border-white/20 bg-black/55 text-[10px] uppercase tracking-wider ${
                  portrait ? "h-7 px-2" : ""
                }`}
                onClick={onExit}
                data-testid="button-run-exit"
              >
                Exit
              </Button>
            )}
          </div>
        )}

        {phase === "paused" && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/75 px-4 text-center backdrop-blur-sm"
            data-testid="pause-overlay"
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#d4af37]">Paused</p>
            <h3 className="mt-2 font-serif text-3xl text-[#f7e7b0]">Walk on hold</h3>
            <p className="mt-2 max-w-sm text-sm text-[#e8dcc0]/70">
              Credits so far: {scoreToCredits(hud.score).toLocaleString()} · {hud.distance}m ·{" "}
              {hud.cleanliness}% clean
            </p>
            <CasinoEntryRules compact className="mt-4" />
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                size="lg"
                className="bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
                onClick={resumeRun}
                data-testid="button-run-resume"
              >
                Resume
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#d4af37]/40 text-[#ffd76a] disabled:opacity-40"
                disabled={!canAffordTable(scoreToCredits(hud.score))}
                onClick={cashOutToBundle}
                data-testid="button-pause-cashout"
              >
                Steal Bundle · {scoreToCredits(hud.score).toLocaleString()}
              </Button>
              <Button size="lg" variant="ghost" className="text-[#e8dcc0]/70" onClick={runItBack}>
                New Walk
              </Button>
            </div>
            <p className="mt-3 text-[11px] text-white/40">Esc / P to resume</p>
          </div>
        )}

        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 ${
            portrait ? "px-2 py-1.5 pr-16" : "p-3 sm:p-4"
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
            <p className={`text-[#ffd76a]/90 ${portrait ? "text-[10px]" : "text-xs"}`}>
              Credits {scoreToCredits(hud.score).toLocaleString()}
            </p>
            <p
              className={`text-muted-foreground ${portrait ? "text-[10px] tabular-nums" : "text-xs"}`}
            >
              {hud.distance}m
              {hud.distance >= FINISH_DISTANCE ? " · BONUS" : ` / ${FINISH_DISTANCE}m`} · L{" "}
              {hud.leftClean}% · R {hud.rightClean}%
              {!portrait && <> · Best {hud.bestScore.toLocaleString()}</>}
            </p>
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
          className={`pointer-events-none absolute z-10 ${
            portrait ? "bottom-2 right-2" : "bottom-24 left-3"
          }`}
        >
          <ShoeCamHud left={shoes.left} right={shoes.right} compact={portrait} />
        </div>

        <div
          className={`relative w-full ${fullscreen ? "min-h-0 flex-1" : "h-[420px] sm:h-[480px]"}`}
          style={fullscreen && !portrait ? { minHeight: "min(60vh, 640px)" } : undefined}
        >
          <CleanSneaksRunScene
            key={sceneKey}
            colorwayId={colorwayId}
            stateRef={stateRef}
            running={phase === "running"}
            onGameOver={endRun}
            onDestination={onDestination}
            onStreakFlash={handleStreakFlash}
            onStatsTick={emitStats}
            className="absolute inset-0"
          />

          {popups.length > 0 && (
            <div
              className={`pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 ${
                portrait ? "top-[42%]" : "bottom-28"
              }`}
            >
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

          {pathOpts && phase === "running" && <CleanPathHud paths={pathOpts} portrait={portrait} />}

          {npcLine && phase === "running" && (
            <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded border border-white/10 bg-black/60 px-3 py-1.5 text-xs text-[#e8e8ec]">
              “{npcLine}”
            </div>
          )}

          {ohNo && phase === "running" && <OhNoOverlay window={ohNo} onAction={onOhNo} />}
        </div>

        {phase === "running" && (
          <div
            className={`pointer-events-auto absolute z-20 flex flex-wrap gap-2 ${
              portrait ? "bottom-2 left-2 right-2 justify-between" : "bottom-3 right-3"
            }`}
          >
            <Button
              size="sm"
              className="h-8 bg-[#d4af37] text-[10px] uppercase tracking-wider text-[#1a1008] hover:bg-[#e0c15a] disabled:opacity-40"
              disabled={!canAffordTable(scoreToCredits(hud.score))}
              onClick={cashOutToBundle}
              data-testid="button-cashout-steal-bundle"
              title={
                canAffordTable(scoreToCredits(hud.score))
                  ? "Cash out your walking credits into Steal the Bundle"
                  : `Need ${CREDITS_MIN_ANTE} credits to cash out`
              }
            >
              Steal Bundle · {scoreToCredits(hud.score).toLocaleString()}
            </Button>
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

        {phase === "colorPick" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
            <p className="seeds-holo-text mb-2 text-xs uppercase tracking-[0.35em]">
              {KLEAN_SNEAKS.title}
            </p>
            <p className="mb-3 text-center text-sm text-[#7EC8D9]">Pick your BALOON8 colorway</p>
            <div className="mb-5 w-full max-w-md rounded-lg border border-white/10 bg-black/50 p-3">
              <Baloon8ColorwayPicker value={colorwayId} onChange={selectColorway} compact />
            </div>
            <Button
              type="button"
              className="mb-3 bg-[#5B8DA8] text-white hover:bg-[#6a9cb8]"
              onClick={confirmColorwayAndCountdown}
              data-testid="button-confirm-colorway"
            >
              Start countdown
            </Button>
            <p className="max-w-xs text-center text-[11px] text-white/45">
              Tap a color to change · then Start countdown (or Enter)
            </p>
          </div>
        )}

        {phase === "countdown" && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm">
            <p className="seeds-holo-text mb-2 text-xs uppercase tracking-[0.35em]">
              {KLEAN_SNEAKS.title}
            </p>
            <p className="mb-1 text-sm text-[#7EC8D9]">
              {sneaker.label ?? "BALOON8"} · Keep the fit clean
            </p>
            <p className="mb-3 text-[11px] uppercase tracking-wider text-white/50">
              Color locked · get ready
            </p>
            <CasinoEntryRules className="mb-4" />
            <p className="mb-2 max-w-xs text-center text-[11px] text-white/50">
              V = Sneak Vision · C = walk style · 1–6 = Oh No saves
            </p>
            <p className="text-6xl font-bold tabular-nums text-foreground sm:text-7xl">
              {countdown > 0 ? countdown : "RUN."}
            </p>
          </div>
        )}

        {phase === "walkComplete" && gameOver && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto bg-black/80 px-4 py-6 text-center backdrop-blur-md"
            data-testid="walk-complete-overlay"
          >
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#d4af37]">Walk Complete</p>
            <h3 className="mt-2 font-serif text-3xl text-[#f7e7b0] sm:text-4xl">Final Score</h3>
            <p className="mt-3 font-serif text-5xl tabular-nums text-[#ffd76a]">
              {gameOver.score.toLocaleString()}
            </p>
            <p className="mt-2 text-sm text-[#e8dcc0]/80">
              {gameOver.score.toLocaleString()} credits — turn them in at the casino door.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button
                size="lg"
                className="bg-[#d4af37] text-[#1a1008] hover:bg-[#e0c15a]"
                onClick={enterCasino}
                data-testid="button-enter-casino"
              >
                Enter Casino
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#ffd76a]/35 text-[#ffd76a]"
                onClick={() => {
                  const offer = buildRewardedOffer({
                    context: "mission_complete",
                    baseCredits: gameOver.score,
                    walkId: `walk-bonus-${Date.now()}`,
                  });
                  if (offer) {
                    setMissionOffer(offer);
                    setMissionRewardOpen(true);
                  } else {
                    setRewardedOpen(true);
                  }
                }}
                data-testid="button-watch-ad-credits"
              >
                Watch ad · bonus credits
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#7EC8D9]/40 text-[#7EC8D9]"
                onClick={continueBonus}
                data-testid="button-continue-bonus"
              >
                Keep Running
              </Button>
              <Button size="lg" variant="ghost" onClick={runItBack}>
                New Walk
              </Button>
            </div>
          </div>
        )}

        <RewardClaimModal
          open={missionRewardOpen}
          title="JOB COMPLETE"
          subtitle="Normal reward is already on your chip stack. Ads are optional."
          offer={missionOffer}
          onClose={() => setMissionRewardOpen(false)}
        />

        <GameRewardedAd open={rewardedOpen} onClose={() => setRewardedOpen(false)} />
        <GameInterstitialAd
          requestOpen={interstitialOpen}
          onComplete={() => {
            setInterstitialOpen(false);
            const resume = interstitialResumeRef.current;
            interstitialResumeRef.current = null;
            resume?.();
          }}
        />

        {phase === "over" && gameOver && (
          <PostMissionReveal
            payload={gameOver}
            onRetry={runItBack}
            onShare={onShare}
            onExit={onExit}
            onPlayBundleCard={
              gameOver.bundleCardUnlocked
                ? () => {
                    setWalkCompleteScore(gameOver.score);
                    setPhase("casino");
                  }
                : onPlayBundleCard
            }
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
