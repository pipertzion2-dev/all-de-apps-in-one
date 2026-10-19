"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { MOVES_LIKE_HEX } from "@/lib/the-moves-like/brand";
import { getMove } from "@/lib/the-moves-like/moves-library";
import {
  detectRenderQuality,
  dprCap,
  prefersReducedMotion,
} from "@/lib/the-moves-like/performance";
import type { AudioAnalysisSnapshot } from "@/lib/the-moves-like/types";
import { DancerFigure } from "@/components/the-moves-like/scenes/DancerFigure";
import { GyroParallaxCamera } from "@/components/the-moves-like/scenes/GyroParallaxCamera";
import { BassPulseRings, SoundWaveBars } from "@/components/the-moves-like/scenes/SoundWaves";

type Props = {
  moveIds?: string[];
  audio?: AudioAnalysisSnapshot | null;
  interactive?: boolean;
  className?: string;
  /** freestyle | dna | rhythm | choreo */
  mode?: "freestyle" | "dna" | "rhythm" | "choreo";
  playbackProgress?: number;
  clipBoundaries?: number[];
  showCaption?: boolean;
  /** Tilt the stage camera with the phone gyroscope when sensors are live */
  gyroParallax?: boolean;
};

function StageFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]} receiveShadow>
      <circleGeometry args={[3.4, 64]} />
      <meshStandardMaterial color="#c5dce8" metalness={0.35} roughness={0.28} />
    </mesh>
  );
}

function ChoreoBeatMarks({ boundaries, progress }: { boundaries: number[]; progress: number }) {
  return (
    <group position={[0, -1.15, 1.4]}>
      {boundaries.map((b, i) => (
        <mesh key={i} position={[(b - 0.5) * 2.8, 0.05, 0]}>
          <boxGeometry args={[0.05, 0.2 + (Math.abs(progress - b) < 0.04 ? 0.25 : 0), 0.05]} />
          <meshStandardMaterial
            color={MOVES_LIKE_HEX.secondary}
            emissive={MOVES_LIKE_HEX.secondary}
            emissiveIntensity={Math.abs(progress - b) < 0.04 ? 0.95 : 0.3}
          />
        </mesh>
      ))}
    </group>
  );
}

function StageContent({
  moveIds,
  audio,
  mode,
  playbackProgress,
  clipBoundaries,
}: Required<Pick<Props, "moveIds" | "mode">> &
  Pick<Props, "audio" | "playbackProgress" | "clipBoundaries">) {
  const pulse = audio?.bass ?? audio?.energy ?? 0;

  return (
    <>
      <color attach="background" args={["#eef6fa"]} />
      <fog attach="fog" args={["#dceaf1", 7, 18]} />
      <ambientLight intensity={0.88} />
      <directionalLight position={[3.5, 5.5, 2.5]} intensity={1.2} color="#ffffff" castShadow />
      <pointLight position={[-2.5, 2.2, -1.5]} intensity={0.7} color="#ac81af" />
      <pointLight position={[2.8, 1.2, 2]} intensity={0.85} color="#6d91b3" />
      <spotLight
        position={[0, 4.5, 2]}
        angle={0.45}
        penumbra={0.55}
        intensity={0.75}
        color="#A8C0D4"
      />

      <StageFloor />

      {/* Rhythm / freestyle: sound-wave bars */}
      {(mode === "rhythm" || mode === "freestyle") && (
        <SoundWaveBars audio={audio ?? null} behind={mode === "freestyle"} />
      )}
      {mode === "rhythm" && <BassPulseRings audio={audio ?? null} />}

      {/* Primary: 3D person dancing the selected move(s) */}
      <DancerFigure
        key={moveIds.join("-") || "idle"}
        moveIds={moveIds}
        audioEnergy={pulse}
        playbackProgress={playbackProgress}
        mode={mode === "rhythm" ? "freestyle" : mode}
      />

      {mode === "choreo" && (
        <ChoreoBeatMarks boundaries={clipBoundaries ?? []} progress={playbackProgress ?? 0} />
      )}
    </>
  );
}

export function MovementStage({
  moveIds = ["two-step", "body-roll"],
  audio = null,
  interactive = true,
  className = "",
  mode = "freestyle",
  playbackProgress = 0,
  clipBoundaries = [],
  showCaption = true,
  gyroParallax = false,
}: Props) {
  const quality = useMemo(() => detectRenderQuality(), []);
  const dpr = useMemo(() => dprCap(quality), [quality]);
  const moveName = getMove(moveIds[0] ?? "")?.name;
  const useGyroCam = gyroParallax && !interactive && !prefersReducedMotion();

  const caption =
    mode === "rhythm"
      ? audio?.energy
        ? "Live sound waves · dancing to analysed audio"
        : "Sound-wave stage · upload a track in Play to drive the bars"
      : useGyroCam
        ? moveName
          ? `Tilt your phone · ${moveName}`
          : "Tilt your phone · illustrative dancer"
        : moveName
          ? `Illustrative dancer · ${moveName}`
          : "Illustrative dancer preview";

  return (
    <div className={`relative h-full min-h-[220px] w-full ${className}`}>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0.55, 3.6], fov: 40 }}
        gl={{ antialias: quality !== "low", alpha: true, powerPreference: "high-performance" }}
        frameloop={prefersReducedMotion() ? "demand" : "always"}
        shadows={quality !== "low"}
      >
        <Suspense fallback={null}>
          <StageContent
            moveIds={moveIds}
            audio={audio}
            mode={mode}
            playbackProgress={playbackProgress}
            clipBoundaries={clipBoundaries}
          />
          {useGyroCam ? <GyroParallaxCamera enabled /> : null}
          {interactive ? (
            <OrbitControls
              enablePan={false}
              minDistance={2.2}
              maxDistance={6}
              maxPolarAngle={Math.PI * 0.68}
              target={[0, 0.1, 0]}
            />
          ) : null}
        </Suspense>
      </Canvas>
      {showCaption ? (
        <p className="pointer-events-none absolute bottom-2 left-2 rounded-lg border border-border/40 bg-white/55 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-primary backdrop-blur-md">
          {caption}
        </p>
      ) : null}
    </div>
  );
}
