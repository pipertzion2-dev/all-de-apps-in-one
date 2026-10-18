"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Home-screen exotic petal shapes, glass-tinted for THE MOVES LIKE stage. */
type PetalShape = "pointed" | "rounded" | "curved" | "teardrop" | "star";

const BLUE = new THREE.Color(0x6d91b3);
const BLUE_SOFT = new THREE.Color(0xa8c0d4);
const PURPLE = new THREE.Color(0xac81af);
const PURPLE_SOFT = new THREE.Color(0xd4c0d6);
const CREAM = new THREE.Color(0xf7fbfc);

function buildPetalGeo(shape: PetalShape, w: number, l: number) {
  switch (shape) {
    case "pointed": {
      const g = new THREE.ConeGeometry(w * 0.55, l, 4, 1);
      g.rotateX(Math.PI / 2);
      return g;
    }
    case "rounded": {
      const g = new THREE.SphereGeometry(w * 0.75, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.6);
      g.scale(1, 0.28, l / Math.max(w * 0.75, 0.01));
      return g;
    }
    case "curved":
      return new THREE.BoxGeometry(w * 0.65, 0.04, l * 1.15);
    case "star": {
      const g = new THREE.ConeGeometry(w * 0.35, l * 0.85, 3, 1);
      g.rotateX(Math.PI / 2);
      return g;
    }
    case "teardrop":
    default: {
      const g = new THREE.SphereGeometry(w * 0.48, 5, 4, 0, Math.PI * 2, 0, Math.PI * 0.7);
      g.scale(1.15, 0.22, l / Math.max(w * 0.48, 0.01));
      return g;
    }
  }
}

function StageFlower({
  position,
  scale = 1,
  purpleBias = false,
  shape = "rounded",
  phase = 0,
}: {
  position: [number, number, number];
  scale?: number;
  purpleBias?: boolean;
  shape?: PetalShape;
  phase?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const colors = purpleBias ? [PURPLE, PURPLE_SOFT, BLUE_SOFT] : [BLUE, BLUE_SOFT, PURPLE_SOFT];
  const petalCount = shape === "star" ? 10 : 6;

  const petals = useMemo(() => {
    const items: {
      geo: THREE.BufferGeometry;
      color: THREE.Color;
      angle: number;
    }[] = [];
    for (let i = 0; i < petalCount; i++) {
      items.push({
        geo: buildPetalGeo(shape, 0.28 * scale, 0.65 * scale),
        color: colors[i % colors.length],
        angle: (i / petalCount) * Math.PI * 2,
      });
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, scale, purpleBias, petalCount]);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.elapsedTime;
    g.rotation.y = Math.sin(t * 0.7 + phase) * 0.35;
    g.position.y = position[1] + Math.sin(t * 1.1 + phase) * 0.06;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {petals.map((p, i) => (
        <mesh
          key={i}
          geometry={p.geo}
          position={[
            Math.cos(p.angle) * 0.14 * scale,
            0.18 * scale,
            Math.sin(p.angle) * 0.14 * scale,
          ]}
          rotation={[0.55, p.angle, 0.45]}
        >
          <meshStandardMaterial
            color={p.color}
            emissive={p.color}
            emissiveIntensity={0.22}
            roughness={0.35}
            metalness={0.12}
            transparent
            opacity={0.92}
          />
        </mesh>
      ))}
      <mesh position={[0, 0.2 * scale, 0]}>
        <sphereGeometry args={[0.08 * scale, 12, 12]} />
        <meshStandardMaterial
          color={CREAM}
          emissive={purpleBias ? PURPLE : BLUE}
          emissiveIntensity={0.4}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
}

/** Soft home-style flower field around the dancer — glass blue / purple only. */
export function GlassFlowerField({ density = "normal" }: { density?: "sparse" | "normal" }) {
  const spots = useMemo(() => {
    const base: {
      position: [number, number, number];
      scale: number;
      purpleBias: boolean;
      shape: PetalShape;
      phase: number;
    }[] = [
      {
        position: [-2.2, -0.2, -0.6],
        scale: 0.85,
        purpleBias: false,
        shape: "rounded",
        phase: 0.2,
      },
      { position: [2.35, 0.1, -0.4], scale: 0.95, purpleBias: true, shape: "teardrop", phase: 1.1 },
      { position: [-1.6, 0.85, -1.4], scale: 0.55, purpleBias: true, shape: "pointed", phase: 2.0 },
      { position: [1.7, 1.05, -1.2], scale: 0.5, purpleBias: false, shape: "curved", phase: 2.7 },
      { position: [0.15, -0.55, 1.55], scale: 0.45, purpleBias: false, shape: "star", phase: 0.8 },
      { position: [-0.9, -0.4, 1.35], scale: 0.4, purpleBias: true, shape: "rounded", phase: 1.6 },
    ];
    return density === "sparse" ? base.slice(0, 3) : base;
  }, [density]);

  return (
    <group>
      {spots.map((s, i) => (
        <StageFlower key={i} {...s} />
      ))}
    </group>
  );
}
