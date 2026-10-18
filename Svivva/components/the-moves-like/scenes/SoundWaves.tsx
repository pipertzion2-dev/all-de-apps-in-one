"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MOVES_LIKE_HEX } from "@/lib/the-moves-like/brand";
import type { AudioAnalysisSnapshot } from "@/lib/the-moves-like/types";
import { detectRenderQuality } from "@/lib/the-moves-like/performance";

/** Vertical EQ-style sound wave bars driven by real analyser data when present. */
export function SoundWaveBars({
  audio,
  behind = false,
}: {
  audio: AudioAnalysisSnapshot | null;
  behind?: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const quality = useMemo(() => detectRenderQuality(), []);
  const count = quality === "low" ? 24 : quality === "medium" ? 40 : 56;
  const meshes = useRef<THREE.Mesh[]>([]);

  const colors = useMemo(() => {
    return Array.from({ length: count }, (_, i) =>
      i % 3 === 0
        ? MOVES_LIKE_HEX.primary
        : i % 3 === 1
          ? MOVES_LIKE_HEX.secondary
          : MOVES_LIKE_HEX.highlight,
    );
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const wave = audio?.waveform;
    const energy = audio?.energy ?? 0;
    const bass = audio?.bass ?? 0;

    meshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      let amp: number;
      if (wave && wave.length) {
        const idx = Math.floor((i / count) * wave.length);
        amp = Math.abs(wave[idx] ?? 0) * (1.2 + energy * 2) + bass * 0.35;
      } else {
        // Idle pulse so the stage still reads as sound waves without audio
        amp =
          0.15 +
          Math.abs(Math.sin(t * 2.2 + i * 0.35)) * 0.35 +
          Math.abs(Math.sin(t * 3.1 + i * 0.12)) * 0.2;
      }
      const h = 0.2 + amp * 2.2;
      mesh.scale.y = h;
      mesh.position.y = h / 2 - 0.9;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.25 + amp * 0.7;
    });
  });

  const span = 4.2;
  const z = behind ? -1.4 : 0.15;

  return (
    <group ref={group} position={[0, 0, z]}>
      {Array.from({ length: count }, (_, i) => {
        const x = (i / (count - 1) - 0.5) * span;
        return (
          <mesh
            key={i}
            ref={(el) => {
              if (el) meshes.current[i] = el;
            }}
            position={[x, 0, 0]}
          >
            <boxGeometry args={[span / count - 0.02, 1, 0.08]} />
            <meshStandardMaterial
              color={colors[i]}
              emissive={colors[i]}
              emissiveIntensity={0.3}
              roughness={0.35}
              metalness={0.25}
              transparent
              opacity={behind ? 0.45 : 0.85}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Radial pulse rings synced to bass — secondary rhythm cue. */
export function BassPulseRings({ audio }: { audio: AudioAnalysisSnapshot | null }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const bass = audio?.bass ?? 0.15 + Math.abs(Math.sin(state.clock.elapsedTime * 2)) * 0.2;
    ref.current.children.forEach((child, i) => {
      const s = 1 + bass * (0.35 + i * 0.12);
      child.scale.setScalar(s);
      child.rotation.z = state.clock.elapsedTime * (0.15 + i * 0.04);
    });
  });

  return (
    <group ref={ref} position={[0, -1.05, 0]}>
      {[0.7, 1.15, 1.65].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.018, 8, 64]} />
          <meshStandardMaterial
            color={i % 2 === 0 ? MOVES_LIKE_HEX.primary : MOVES_LIKE_HEX.secondary}
            emissive={i % 2 === 0 ? MOVES_LIKE_HEX.primary : MOVES_LIKE_HEX.secondary}
            emissiveIntensity={0.5}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
