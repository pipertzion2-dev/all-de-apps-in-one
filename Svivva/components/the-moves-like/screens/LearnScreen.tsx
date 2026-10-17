"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MOVES_LIBRARY, getMove } from "@/lib/the-moves-like/moves-library";
import { useMovesLikeStore } from "@/lib/the-moves-like/store";
import {
  detectPoseFrame,
  loadPoseLandmarker,
  meanJointDistance,
  poseCoverage,
  POSE_CONNECTIONS,
} from "@/lib/the-moves-like/pose-tracker";
import type { PoseFrame } from "@/lib/the-moves-like/types";
import { FrontCameraViewport } from "@/components/the-moves-like/FrontCameraViewport";
import {
  GlassButton,
  GlassChip,
  GlassDock,
  GlassMagentaButton,
  GlassPanel,
} from "@/components/the-moves-like/ui/Glass";
import { useFrontCamera } from "@/lib/the-moves-like/use-front-camera";

export function LearnScreen() {
  const selectedMoveIds = useMovesLikeStore((s) => s.selectedMoveIds);
  const [moveId, setMoveId] = useState(() => selectedMoveIds[0] ?? "two-step");
  const [step, setStep] = useState(0);
  const move = getMove(moveId) ?? MOVES_LIBRARY[0]!;
  const recordPractice = useMovesLikeStore((s) => s.recordPractice);
  const practiceLoop = useMovesLikeStore((s) => s.practiceLoop);
  const setPracticeLoop = useMovesLikeStore((s) => s.setPracticeLoop);

  const userVideo = useRef<HTMLVideoElement>(null);
  const refVideo = useRef<HTMLVideoElement>(null);
  const userCanvas = useRef<HTMLCanvasElement>(null);

  const camera = useFrontCamera({ videoRef: userVideo, autoStart: true });

  const [opacity, setOpacity] = useState(0.45);
  const [rate, setRate] = useState(0.75);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showRef, setShowRef] = useState(true);
  const [poseStatus, setPoseStatus] = useState<"idle" | "loading" | "ready" | "unavailable">(
    "idle",
  );
  const [coverage, setCoverage] = useState<number | null>(null);
  const [jointDist, setJointDist] = useState<{
    measured: boolean;
    value: number | null;
    reason?: string;
  }>({ measured: false, value: null });
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (selectedMoveIds[0] && selectedMoveIds[0] !== moveId) {
      setMoveId(selectedMoveIds[0]);
      setStep(0);
    }
    // Sync when Discover "Cam" picks a move — don't fight manual chips
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMoveIds[0]]);

  const landmarkerRef = useRef<Awaited<ReturnType<typeof loadPoseLandmarker>>>(null);

  const drawSkeleton = useCallback((canvas: HTMLCanvasElement, frame: PoseFrame, color: string) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!frame.landmarks.length) return;
    // Mirror-aware: video is CSS-mirrored; canvas sits on top unmirrored in same box —
    // draw in video space then flip canvas with CSS on the element.
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    for (const [a, b] of POSE_CONNECTIONS) {
      const pa = frame.landmarks[a];
      const pb = frame.landmarks[b];
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x * canvas.width, pa.y * canvas.height);
      ctx.lineTo(pb.x * canvas.width, pb.y * canvas.height);
      ctx.stroke();
    }
    for (const p of frame.landmarks) {
      ctx.beginPath();
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    if (refVideo.current) refVideo.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const ref = refVideo.current;
    if (!ref || !practiceLoop || practiceLoop.moveId !== moveId) return;
    const onTime = () => {
      if (ref.currentTime >= practiceLoop.loopEndSec) {
        ref.currentTime = practiceLoop.loopStartSec;
        void ref.play();
      }
    };
    ref.addEventListener("timeupdate", onTime);
    return () => ref.removeEventListener("timeupdate", onTime);
  }, [practiceLoop, moveId]);

  useEffect(() => {
    if (!camera.active) return;
    let cancelled = false;
    setPoseStatus("loading");
    void loadPoseLandmarker().then((lm) => {
      if (cancelled) return;
      landmarkerRef.current = lm;
      setPoseStatus(lm ? "ready" : "unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, [camera.active]);

  useEffect(() => {
    if (poseStatus !== "ready" || !landmarkerRef.current) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const lm = landmarkerRef.current;
      const userV = userVideo.current;
      if (!lm || !userV || userV.readyState < 2) return;
      const now = performance.now();
      const userFrame = detectPoseFrame(lm, userV, now);
      if (showSkeleton && userCanvas.current) {
        userCanvas.current.width = userV.videoWidth || 720;
        userCanvas.current.height = userV.videoHeight || 1280;
        drawSkeleton(userCanvas.current, userFrame, "#6D91B3");
      }
      setCoverage(poseCoverage(userFrame));

      const refV = refVideo.current;
      if (refV && refV.readyState >= 2 && !refV.paused) {
        const refFrame = detectPoseFrame(lm, refV, now + 1);
        const cmp = meanJointDistance(userFrame, refFrame);
        if (cmp.measured) setJointDist({ measured: true, value: cmp.distance });
        else setJointDist({ measured: false, value: null, reason: cmp.reason });
      } else {
        setJointDist({
          measured: false,
          value: null,
          reason: "Play the reference PIP to compare when pose tracking is ready.",
        });
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [poseStatus, showSkeleton, drawSkeleton]);

  const syncPlay = async () => {
    const a = refVideo.current;
    if (a) {
      a.currentTime = 0;
      await a.play().catch(() => undefined);
    }
    recordPractice(moveId);
  };

  const stepFrame = (dir: 1 | -1) => {
    const a = refVideo.current;
    if (!a) return;
    a.pause();
    a.currentTime = Math.max(0, a.currentTime + dir * (1 / 30));
  };

  return (
    <div className="relative pb-[calc(3.75rem+env(safe-area-inset-bottom))] sm:pb-0">
      {/* Full-bleed front camera — primary phone experience */}
      <FrontCameraViewport
        ref={userVideo}
        className="h-[100dvh] max-h-[100dvh] sm:h-[min(100dvh,920px)] sm:max-h-none"
        overlay={
          <>
            <canvas
              ref={userCanvas}
              className={`pointer-events-none absolute inset-0 h-full w-full scale-x-[-1] ${
                showSkeleton ? "" : "hidden"
              }`}
            />

            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
              <GlassPanel tint="ink" className="px-3 py-2" padding={false}>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#AC81AF]">
                  Ghost Mode · Front camera
                </p>
                <h2 className="text-lg font-bold text-[hsl(180_20%_12%)]">{move.name}</h2>
              </GlassPanel>
              <span className="tml-glass-teal px-3 py-1.5 text-[10px] uppercase tracking-[0.12em] text-primary">
                {camera.starting
                  ? "Opening…"
                  : camera.active
                    ? poseStatus === "ready"
                      ? "Tracking"
                      : "Live"
                    : "Camera off"}
              </span>
            </div>

            {showRef ? (
              <div
                className="tml-glass absolute right-3 top-24 w-[32vw] max-w-[140px] overflow-hidden p-0 sm:right-6 sm:top-28 sm:max-w-[180px]"
                style={{ opacity }}
              >
                <p className="bg-[rgba(172,129,175,0.22)] px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[#AC81AF]">
                  Reference
                </p>
                <video
                  ref={refVideo}
                  className="aspect-[9/16] w-full object-cover"
                  muted
                  playsInline
                  loop
                  crossOrigin="anonymous"
                  src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
                />
              </div>
            ) : null}

            <div className="absolute inset-x-0 bottom-0 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
              <GlassDock className="space-y-3">
                <p className="text-center text-sm text-foreground">{move.tutorialSteps[step]}</p>

                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                  {MOVES_LIBRARY.slice(0, 8).map((m) => (
                    <GlassChip
                      key={m.id}
                      active={moveId === m.id}
                      onClick={() => {
                        setMoveId(m.id);
                        setStep(0);
                      }}
                    >
                      {m.name}
                    </GlassChip>
                  ))}
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <GlassMagentaButton
                    type="button"
                    className="col-span-2"
                    onClick={() => void syncPlay()}
                  >
                    Practice
                  </GlassMagentaButton>
                  <GlassButton
                    type="button"
                    variant="outline"
                    onClick={() => setShowRef((v) => !v)}
                  >
                    {showRef ? "Hide ref" : "Show ref"}
                  </GlassButton>
                  <GlassButton type="button" variant="outline" onClick={() => setSheetOpen(true)}>
                    Controls
                  </GlassButton>
                </div>

                {!camera.active && !camera.starting ? (
                  <GlassButton type="button" className="w-full" onClick={() => void camera.start()}>
                    Enable front camera
                  </GlassButton>
                ) : null}
                {camera.error ? (
                  <p className="text-center text-xs text-destructive">{camera.error}</p>
                ) : null}
              </GlassDock>
            </div>
          </>
        }
      />

      {/* Controls sheet */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/25 backdrop-blur-sm sm:items-center sm:justify-center">
          <GlassPanel
            tint="ink"
            className="max-h-[80dvh] w-full overflow-y-auto rounded-t-3xl border-border/50 bg-white/85 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                Practice controls
              </h3>
              <GlassButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSheetOpen(false)}
              >
                Done
              </GlassButton>
            </div>
            <label className="block text-xs text-muted-foreground">
              Ghost opacity ({Math.round(opacity * 100)}%)
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <label className="mt-4 block text-xs text-muted-foreground">
              Slow motion ({rate.toFixed(2)}×)
              <input
                type="range"
                min={0.25}
                max={1.25}
                step={0.05}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => stepFrame(-1)}
                className="min-h-[44px] border border-border/40 bg-white/55 backdrop-blur-md px-3 text-xs text-foreground"
              >
                −1 frame
              </button>
              <button
                type="button"
                onClick={() => stepFrame(1)}
                className="min-h-[44px] border border-border/40 bg-white/55 backdrop-blur-md px-3 text-xs text-foreground"
              >
                +1 frame
              </button>
              <button
                type="button"
                onClick={() => setShowSkeleton((v) => !v)}
                className="min-h-[44px] border border-border/40 bg-white/55 backdrop-blur-md px-3 text-xs text-foreground"
              >
                Skeleton {showSkeleton ? "on" : "off"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setPracticeLoop({
                    moveId,
                    loopStartSec: Math.max(0, (refVideo.current?.currentTime ?? 0) - 1),
                    loopEndSec: (refVideo.current?.currentTime ?? 2) + 1,
                  })
                }
                className="min-h-[44px] border border-primary/50 px-3 text-xs text-primary"
              >
                Loop section
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="min-h-[44px] flex-1 border border-border/40 bg-white/55 backdrop-blur-md text-xs disabled:opacity-40"
              >
                Prev step
              </button>
              <button
                type="button"
                disabled={step >= move.tutorialSteps.length - 1}
                onClick={() => setStep((s) => Math.min(move.tutorialSteps.length - 1, s + 1))}
                className="min-h-[44px] flex-1 bg-primary text-xs font-semibold text-primary-foreground disabled:opacity-40"
              >
                Next step
              </button>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Pose:{" "}
              {poseStatus === "ready"
                ? "MediaPipe active (measured landmarks)"
                : poseStatus === "loading"
                  ? "Loading…"
                  : "Guidance only"}
              . Coverage: {coverage == null ? "—" : `${Math.round(coverage * 100)}% visibility`}.
              Distance:{" "}
              {jointDist.measured && jointDist.value != null
                ? jointDist.value.toFixed(3)
                : (jointDist.reason ?? "Not measured")}
            </p>
          </GlassPanel>
        </div>
      ) : null}
    </div>
  );
}
