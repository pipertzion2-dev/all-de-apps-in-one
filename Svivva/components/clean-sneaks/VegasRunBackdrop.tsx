"use client";

import { useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

type Props = {
  /** How many panorama panels to tile along the run */
  segments?: number;
  mobile?: boolean;
};

/**
 * Distant Las Vegas–style strip panorama (reference photo on a billboard plane).
 */
export function VegasRunBackdrop({ segments = 4, mobile = false }: Props) {
  const tex = useTexture("/clean-sneaks/vegas-strip-night.jpg");
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;

  const panels = useMemo(
    () =>
      Array.from({ length: segments }, (_, i) => ({
        z: -44 - i * (mobile ? 38 : 44),
        y: mobile ? 10.5 : 12,
        w: mobile ? 46 : 58,
        h: mobile ? 22 : 28,
      })),
    [segments, mobile],
  );

  return (
    <group name="vegas-strip-backdrop">
      {panels.map((p, i) => (
        <mesh key={i} position={[0, p.y, p.z]} renderOrder={-20}>
          <planeGeometry args={[p.w, p.h]} />
          <meshBasicMaterial
            map={tex}
            toneMapped={false}
            fog
            transparent
            opacity={0.94}
            depthWrite={false}
          />
        </mesh>
      ))}
      {/* Soft magenta/gold haze under the skyline */}
      {panels.map((p, i) => (
        <mesh key={`glow-${i}`} position={[0, p.y - p.h * 0.42, p.z + 0.8]} renderOrder={-21}>
          <planeGeometry args={[p.w * 1.05, p.h * 0.35]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#ff4da6" : "#ffb347"}
            transparent
            opacity={0.08}
            toneMapped={false}
            depthWrite={false}
            fog
          />
        </mesh>
      ))}
    </group>
  );
}

useTexture.preload("/clean-sneaks/vegas-strip-night.jpg");
