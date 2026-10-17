"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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

const MovementStage = dynamic(
  () => import("@/components/the-moves-like/scenes/MovementStage").then((m) => m.MovementStage),
  { ssr: false },
);

export function LearnScreen() {
  const [moveId, setMoveId] = useState("two-step");
  const move = getMove(moveId) ?? MOVES_LIBRARY[0]!;
  const recordPractice = useMovesLikeStore((s) => s.recordPractice);
  const practiceLoop = useMovesLikeStore((s) => s.practiceLoop);
  const setPracticeLoop = useMovesLikeStore((s) => s.setPracticeLoop);

  const refVideo = useRef<HTMLVideoElement>(null);
  const userVideo = useRef<HTMLVideoElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  const userCanvas = useRef<HTMLCanvasElement>(null);

  const [opacity, setOpacity] = useState(0.55);
  const [rate, setRate] = useState(1);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [poseStatus, setPoseStatus] = useState<"idle" | "loading" | "ready" | "unavailable">(
    "idle",
  );
  const [coverage, setCoverage] = useState<number | null>(null);
  const [jointDist, setJointDist] = useState<{
    measured: boolean;
    value: number | null;
    reason?: string;
  }>({ measured: false, value: null });
  const [camError, setCamError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [step, setStep] = useState(0);

  const landmarkerRef = useRef<Awaited<ReturnType<typeof loadPoseLandmarker>>>(null);

  const drawSkeleton = useCallback((canvas: HTMLCanvasElement, frame: PoseFrame, color: string) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!frame.landmarks.length) return;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
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
      ctx.arc(p.x * canvas.width, p.y * canvas.height, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    if (refVideo.current) refVideo.current.playbackRate = rate;
    if (userVideo.current) userVideo.current.playbackRate = rate;
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

  const enableCamera = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (userVideo.current) {
        userVideo.current.srcObject = stream;
        await userVideo.current.play();
      }
      setCameraOn(true);
      setPoseStatus("loading");
      const lm = await loadPoseLandmarker();
      landmarkerRef.current = lm;
      setPoseStatus(lm ? "ready" : "unavailable");
    } catch {
      setCamError("Camera permission denied or unavailable.");
      setPoseStatus("unavailable");
    }
  };

  useEffect(() => {
    if (poseStatus !== "ready" || !landmarkerRef.current) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const lm = landmarkerRef.current;
      if (!lm) return;
      const now = performance.now();
      const userV = userVideo.current;
      const refV = refVideo.current;
      let userFrame: PoseFrame = { timestampMs: now, landmarks: [], source: "none" };
      let refFrame: PoseFrame = { timestampMs: now, landmarks: [], source: "none" };

      if (userV && userV.readyState >= 2) {
        userFrame = detectPoseFrame(lm, userV, now);
        if (showSkeleton && userCanvas.current) {
          userCanvas.current.width = userV.videoWidth || 640;
          userCanvas.current.height = userV.videoHeight || 480;
          drawSkeleton(userCanvas.current, userFrame, "#5B8DA8");
        }
        setCoverage(poseCoverage(userFrame));
      }
      if (refV && refV.readyState >= 2 && refV.srcObject) {
        refFrame = detectPoseFrame(lm, refV, now + 1);
        if (showSkeleton && refCanvas.current) {
          refCanvas.current.width = refV.videoWidth || 640;
          refCanvas.current.height = refV.videoHeight || 480;
          drawSkeleton(refCanvas.current, refFrame, "#C44A9A");
        }
      }
      const cmp = meanJointDistance(userFrame, refFrame);
      if (cmp.measured) {
        setJointDist({ measured: true, value: cmp.distance });
      } else {
        setJointDist({ measured: false, value: null, reason: cmp.reason });
      }
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [poseStatus, showSkeleton, drawSkeleton]);

  const syncPlay = async () => {
    const a = refVideo.current;
    const b = userVideo.current;
    if (a) {
      a.currentTime = 0;
      await a.play().catch(() => undefined);
    }
    if (b) {
      b.currentTime = 0;
      await b.play().catch(() => undefined);
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
    <div className="space-y-6 px-4 py-6 sm:px-8">
      <header>
        <h2 className="text-2xl font-bold text-white">Learn · Ghost Mode</h2>
        <p className="mt-1 max-w-2xl text-sm text-[#9BB0B8]">
          Compare a reference with your camera. Measured feedback only appears when MediaPipe
          landmarks are available on both streams — otherwise you get visual guidance only.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {MOVES_LIBRARY.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMoveId(m.id);
              setStep(0);
            }}
            className={`rounded-md px-3 py-1.5 text-xs uppercase tracking-[0.12em] ${
              moveId === m.id ? "bg-[#5B8DA8] text-[#071014]" : "bg-white/10 text-[#C8D8DE]"
            }`}
          >
            {m.name}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden border border-white/10 bg-black">
          <p className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#C44A9A]">
            Reference
          </p>
          <video
            ref={refVideo}
            className="aspect-video w-full object-cover opacity-90"
            style={{ opacity }}
            muted
            playsInline
            loop
            crossOrigin="anonymous"
            // Public domain-ish sample — instructional placeholder, not a claim of choreography ownership
            src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
          />
          <canvas ref={refCanvas} className="pointer-events-none absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-3">
            <p className="text-xs text-[#C8D8DE]">
              Demo clip for sync controls. Tutorial steps below are the real move guidance.
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden border border-white/10 bg-black">
          <p className="absolute left-2 top-2 z-10 rounded bg-black/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#5B8DA8]">
            You
          </p>
          <video ref={userVideo} className="aspect-video w-full object-cover" muted playsInline />
          <canvas ref={userCanvas} className="pointer-events-none absolute inset-0 h-full w-full" />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#071014]/80">
              <button
                type="button"
                onClick={() => void enableCamera()}
                className="rounded-md bg-[#5B8DA8] px-4 py-2 text-sm font-semibold text-[#071014]"
              >
                Enable camera
              </button>
            </div>
          )}
        </div>
      </div>

      {camError ? <p className="text-sm text-[#E07070]">{camError}</p> : null}

      <div className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-2">
        <label className="block text-xs text-[#9BB0B8]">
          Reference opacity ({Math.round(opacity * 100)}%)
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
        <label className="block text-xs text-[#9BB0B8]">
          Playback speed ({rate.toFixed(2)}×)
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void syncPlay()}
            className="rounded-md bg-[#C44A9A] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white"
          >
            Sync play
          </button>
          <button
            type="button"
            onClick={() => stepFrame(-1)}
            className="rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white"
          >
            −1 frame
          </button>
          <button
            type="button"
            onClick={() => stepFrame(1)}
            className="rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white"
          >
            +1 frame
          </button>
          <button
            type="button"
            onClick={() => setShowSkeleton((v) => !v)}
            className="rounded-md border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.12em] text-white"
          >
            Skeletons {showSkeleton ? "on" : "off"}
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
            className="rounded-md border border-[#5B8DA8]/50 px-3 py-2 text-xs uppercase tracking-[0.12em] text-[#90C4D8]"
          >
            Loop hard section
          </button>
        </div>
        <div className="space-y-1 text-xs text-[#C8D8DE]">
          <p>
            Pose system:{" "}
            <span className="text-white">
              {poseStatus === "ready"
                ? "MediaPipe active (measured)"
                : poseStatus === "loading"
                  ? "Loading…"
                  : poseStatus === "unavailable"
                    ? "Unavailable — guidance only"
                    : "Idle"}
            </span>
          </p>
          <p>
            Landmark coverage:{" "}
            {coverage == null ? "—" : `${Math.round(coverage * 100)}% (visibility, not accuracy)`}
          </p>
          <p>
            Joint distance:{" "}
            {jointDist.measured && jointDist.value != null
              ? jointDist.value.toFixed(3)
              : (jointDist.reason ?? "Not measured")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#90C4D8]">
            {move.name} · step {step + 1}/{move.tutorialSteps.length}
          </h3>
          <p className="mt-3 text-base text-white">{move.tutorialSteps[step]}</p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-md border border-white/20 px-3 py-2 text-xs disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={step >= move.tutorialSteps.length - 1}
              onClick={() => setStep((s) => Math.min(move.tutorialSteps.length - 1, s + 1))}
              className="rounded-md bg-[#5B8DA8] px-3 py-2 text-xs font-semibold text-[#071014] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
        <div className="h-56 overflow-hidden border border-white/10">
          <MovementStage moveIds={[moveId]} mode="dna" interactive={false} />
        </div>
      </div>
    </div>
  );
}
