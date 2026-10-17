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
        drawSkeleton(userCanvas.current, userFrame, "#5B8DA8");
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

            {/* Top: move chip + camera status */}
            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[#E8A0D0]">
                  Ghost Mode · Front camera
                </p>
                <h2 className="text-lg font-bold text-white drop-shadow">{move.name}</h2>
              </div>
              <div className="rounded-full bg-black/50 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#90C4D8] backdrop-blur">
                {camera.starting
                  ? "Opening…"
                  : camera.active
                    ? poseStatus === "ready"
                      ? "Tracking"
                      : "Live"
                    : "Camera off"}
              </div>
            </div>

            {/* Reference PIP — ghost overlay for phones */}
            {showRef ? (
              <div
                className="absolute right-3 top-20 w-[32vw] max-w-[140px] overflow-hidden rounded-lg border border-white/25 bg-black/60 shadow-lg sm:right-6 sm:top-24 sm:max-w-[180px]"
                style={{ opacity }}
              >
                <p className="bg-black/50 px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[#C44A9A]">
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

            {/* Bottom control dock — thumb reach */}
            <div className="absolute inset-x-0 bottom-0 space-y-3 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
              <p className="text-center text-sm text-white/90 drop-shadow">
                {move.tutorialSteps[step]}
              </p>

              <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
                {MOVES_LIBRARY.slice(0, 8).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMoveId(m.id);
                      setStep(0);
                    }}
                    className={`shrink-0 rounded-full px-3 py-2 text-[11px] font-semibold ${
                      moveId === m.id
                        ? "bg-[#5B8DA8] text-[#071014]"
                        : "bg-white/15 text-white backdrop-blur"
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => void syncPlay()}
                  className="col-span-2 min-h-[48px] bg-[#C44A9A] text-sm font-semibold text-white"
                >
                  Practice
                </button>
                <button
                  type="button"
                  onClick={() => setShowRef((v) => !v)}
                  className="min-h-[48px] border border-white/25 bg-black/40 text-xs text-white"
                >
                  {showRef ? "Hide ref" : "Show ref"}
                </button>
                <button
                  type="button"
                  onClick={() => setSheetOpen(true)}
                  className="min-h-[48px] border border-white/25 bg-black/40 text-xs text-white"
                >
                  Controls
                </button>
              </div>

              {!camera.active && !camera.starting ? (
                <button
                  type="button"
                  onClick={() => void camera.start()}
                  className="w-full min-h-[52px] bg-[#5B8DA8] text-sm font-semibold text-[#071014]"
                >
                  Enable front camera
                </button>
              ) : null}
              {camera.error ? (
                <p className="text-center text-xs text-[#E07070]">{camera.error}</p>
              ) : null}
            </div>
          </>
        }
      />

      {/* Controls sheet */}
      {sheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 sm:items-center sm:justify-center">
          <div className="max-h-[80dvh] w-full overflow-y-auto border-t border-white/15 bg-[#0c1619] p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-xl sm:border">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
                Practice controls
              </h3>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="text-sm text-white"
              >
                Done
              </button>
            </div>
            <label className="block text-xs text-[#9BB0B8]">
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
            <label className="mt-4 block text-xs text-[#9BB0B8]">
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
                className="min-h-[44px] border border-white/20 px-3 text-xs text-white"
              >
                −1 frame
              </button>
              <button
                type="button"
                onClick={() => stepFrame(1)}
                className="min-h-[44px] border border-white/20 px-3 text-xs text-white"
              >
                +1 frame
              </button>
              <button
                type="button"
                onClick={() => setShowSkeleton((v) => !v)}
                className="min-h-[44px] border border-white/20 px-3 text-xs text-white"
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
                className="min-h-[44px] border border-[#5B8DA8]/50 px-3 text-xs text-[#90C4D8]"
              >
                Loop section
              </button>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="min-h-[44px] flex-1 border border-white/20 text-xs disabled:opacity-40"
              >
                Prev step
              </button>
              <button
                type="button"
                disabled={step >= move.tutorialSteps.length - 1}
                onClick={() => setStep((s) => Math.min(move.tutorialSteps.length - 1, s + 1))}
                className="min-h-[44px] flex-1 bg-[#5B8DA8] text-xs font-semibold text-[#071014] disabled:opacity-40"
              >
                Next step
              </button>
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-[#9BB0B8]">
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
