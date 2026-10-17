"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { MOVES_LIKE_HEX } from "@/lib/the-moves-like/brand";
import { buildIllustrativeDna } from "@/lib/the-moves-like/motion-dna";
import { getMove } from "@/lib/the-moves-like/moves-library";
import {
  detectRenderQuality,
  dprCap,
  particleBudget,
  prefersReducedMotion,
} from "@/lib/the-moves-like/performance";
import type { AudioAnalysisSnapshot } from "@/lib/the-moves-like/types";

type Props = {
  moveIds?: string[];
  audio?: AudioAnalysisSnapshot | null;
  interactive?: boolean;
  className?: string;
  /** freestyle | dna | rhythm | choreo */
  mode?: "freestyle" | "dna" | "rhythm" | "choreo";
  playbackProgress?: number;
  clipBoundaries?: number[];
  /** Hide the DNA honesty caption (Discover shows it elsewhere). */
  showCaption?: boolean;
};

function SprayBars({ pulse = 0 }: { pulse?: number }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!group.current || prefersReducedMotion()) return;
    group.current.rotation.y += dt * 0.08;
  });
  const bars = useMemo(() => {
    const out: { x: number; h: number; color: number }[] = [];
    for (let i = 0; i < 6; i++) {
      out.push({
        x: (i - 2.5) * 0.55,
        h: 1.4 + (i % 3) * 0.25,
        color: i % 2 === 0 ? MOVES_LIKE_HEX.primary : MOVES_LIKE_HEX.secondary,
      });
    }
    return out;
  }, []);

  return (
    <group ref={group} position={[0, -0.2, -1.2]}>
      {bars.map((b, i) => (
        <mesh key={i} position={[b.x, (b.h * (1 + pulse * 0.15)) / 2, 0]}>
          <boxGeometry args={[0.08, b.h * (1 + pulse * 0.15), 0.08]} />
          <meshStandardMaterial
            color={b.color}
            emissive={b.color}
            emissiveIntensity={0.25 + pulse * 0.35}
            roughness={0.55}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function DnaCurves({ moveIds, audioEnergy }: { moveIds: string[]; audioEnergy: number }) {
  const quality = useMemo(() => detectRenderQuality(), []);
  const moves = useMemo(
    () => moveIds.map((id) => getMove(id)).filter((m): m is NonNullable<typeof m> => Boolean(m)),
    [moveIds],
  );
  const data = useMemo(() => buildIllustrativeDna(moves, quality), [moves, quality]);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current || prefersReducedMotion()) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.25;
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.7) * 0.05;
  });

  const curves = useMemo(() => {
    return data.curves.map((curve) => {
      const pts = curve.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      return new THREE.CatmullRomCurve3(pts);
    });
  }, [data.curves]);

  const budget = particleBudget(quality);

  return (
    <group ref={group}>
      {curves.map((curve, i) => {
        const tubular = quality === "low" ? 32 : 64;
        return (
          <mesh key={`c-${i}`}>
            <tubeGeometry args={[curve, tubular, 0.025 + audioEnergy * 0.02, 6, false]} />
            <meshStandardMaterial
              color={data.color}
              emissive={data.color}
              emissiveIntensity={0.35 + audioEnergy * 0.5}
              roughness={0.35}
              metalness={0.4}
            />
          </mesh>
        );
      })}
      {data.rings.map((r, i) => (
        <mesh key={`r-${i}`} rotation={[r.tilt, 0, r.tilt * 0.5]} position={[0, r.y, 0]}>
          <torusGeometry args={[r.radius * (1 + audioEnergy * 0.2), 0.015, 8, 48]} />
          <meshStandardMaterial
            color={MOVES_LIKE_HEX.highlight}
            emissive={MOVES_LIKE_HEX.highlight}
            emissiveIntensity={0.4}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[
              new Float32Array(data.particles.slice(0, budget).flatMap((p) => [p.x, p.y, p.z])),
              3,
            ]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.03}
          color={MOVES_LIKE_HEX.tertiary}
          sizeAttenuation
          transparent
          opacity={0.85}
        />
      </points>
    </group>
  );
}

function RhythmRings({ audio }: { audio: AudioAnalysisSnapshot | null }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const bass = audio?.bass ?? 0;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const s = 1 + bass * (0.4 + i * 0.1) + Math.sin(t * 2 + i) * 0.02;
      child.scale.setScalar(s);
      child.rotation.z = t * (0.2 + i * 0.05);
    });
  });

  return (
    <group ref={ref}>
      {[0.6, 1.0, 1.45, 1.95].map((r, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.02, 8, 64]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? MOVES_LIKE_HEX.primary : MOVES_LIKE_HEX.secondary}
            emissive={i % 2 === 0 ? MOVES_LIKE_HEX.primary : MOVES_LIKE_HEX.secondary}
            emissiveIntensity={0.45}
            transparent
            opacity={0.55}
          />
        </mesh>
      ))}
    </group>
  );
}

function WaveformRibbon({ audio }: { audio: AudioAnalysisSnapshot | null }) {
  const mesh = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.PlaneGeometry(3.2, 0.6, 127, 1), []);

  useFrame(() => {
    if (!mesh.current || !audio) return;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 128; i++) {
      const y = (audio.waveform[i] ?? 0) * (0.8 + audio.energy);
      pos.setY(i, y);
      pos.setY(i + 128, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={mesh} geometry={geo} position={[0, -1.15, 0.2]} rotation={[-0.4, 0, 0]}>
      <meshStandardMaterial
        color={MOVES_LIKE_HEX.highlight}
        emissive={MOVES_LIKE_HEX.primary}
        emissiveIntensity={0.3}
        side={THREE.DoubleSide}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

function ChoreoMarkers({ boundaries, progress }: { boundaries: number[]; progress: number }) {
  return (
    <group position={[0, -1.35, 0]}>
      {boundaries.map((b, i) => (
        <mesh key={i} position={[(b - 0.5) * 3.2, 0, 0]}>
          <boxGeometry args={[0.04, 0.25 + (Math.abs(progress - b) < 0.05 ? 0.2 : 0), 0.04]} />
          <meshStandardMaterial
            color={MOVES_LIKE_HEX.secondary}
            emissive={MOVES_LIKE_HEX.secondary}
            emissiveIntensity={Math.abs(progress - b) < 0.05 ? 0.9 : 0.25}
          />
        </mesh>
      ))}
      <mesh position={[(progress - 0.5) * 3.2, 0.2, 0]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color={MOVES_LIKE_HEX.highlight}
          emissive={MOVES_LIKE_HEX.highlight}
          emissiveIntensity={0.8}
        />
      </mesh>
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
      <color attach="background" args={["#071014"]} />
      <fog attach="fog" args={["#071014", 6, 16]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} color="#e8f4f8" />
      <pointLight position={[-3, 2, -2]} intensity={0.7} color="#c44a9a" />
      <pointLight position={[3, 1, 2]} intensity={0.55} color="#5b8da8" />

      <SprayBars pulse={pulse} />

      {(mode === "dna" || mode === "freestyle" || mode === "choreo") && (
        <Float speed={prefersReducedMotion() ? 0 : 1.2} floatIntensity={0.4}>
          <DnaCurves moveIds={moveIds} audioEnergy={pulse} />
        </Float>
      )}

      {(mode === "rhythm" || mode === "freestyle") && <RhythmRings audio={audio ?? null} />}
      {mode === "rhythm" && <WaveformRibbon audio={audio ?? null} />}
      {mode === "choreo" && (
        <ChoreoMarkers boundaries={clipBoundaries ?? []} progress={playbackProgress ?? 0} />
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.55, 0]} receiveShadow>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial color="#0c181c" metalness={0.6} roughness={0.4} />
      </mesh>
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
}: Props) {
  const quality = useMemo(() => detectRenderQuality(), []);
  const dpr = useMemo(() => dprCap(quality), [quality]);

  return (
    <div className={`relative h-full min-h-[220px] w-full ${className}`}>
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0.35, 4.2], fov: 42 }}
        gl={{ antialias: quality !== "low", alpha: true, powerPreference: "high-performance" }}
        frameloop={prefersReducedMotion() ? "demand" : "always"}
      >
        <Suspense fallback={null}>
          <StageContent
            moveIds={moveIds}
            audio={audio}
            mode={mode}
            playbackProgress={playbackProgress}
            clipBoundaries={clipBoundaries}
          />
          {interactive ? (
            <OrbitControls
              enablePan={false}
              minDistance={2.4}
              maxDistance={7}
              maxPolarAngle={Math.PI * 0.72}
            />
          ) : null}
        </Suspense>
      </Canvas>
      {showCaption ? (
        <p className="pointer-events-none absolute bottom-2 left-2 bg-black/50 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-[#90C4D8]">
          Illustrative Motion DNA · not measured tracking
        </p>
      ) : null}
    </div>
  );
}
