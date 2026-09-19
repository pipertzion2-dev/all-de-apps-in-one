"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildingFacadeTexture } from "@/lib/clean-sneaks/run-textures";
import {
  layoutVegasSegments,
  resortShellMaterial,
  vegasSeed,
  type VegasSegmentLayout,
} from "@/lib/clean-sneaks/vegas-strip-3d";

type Props = {
  segments?: number;
  mobile?: boolean;
  castShadows?: boolean;
  /** Reserved for a future strip video plane — hidden for now */
  videoSlot?: boolean;
};

function NeonMarquee({
  width,
  color,
  y,
  z,
}: {
  width: number;
  color: string;
  y: number;
  z: number;
}) {
  return (
    <group position={[0, y, z]}>
      <mesh>
        <boxGeometry args={[width, 0.35, 0.12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      {Array.from({ length: Math.min(14, Math.floor(width * 2)) }, (_, i) => (
        <mesh
          key={i}
          position={[-width / 2 + 0.35 + i * (width / 13), 0, 0.08]}
        >
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshBasicMaterial color={i % 2 === 0 ? "#fff6e0" : color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function ResortBlock({
  w,
  h,
  d,
  seed,
  neon,
  castShadows,
  x,
  z,
}: {
  w: number;
  h: number;
  d: number;
  seed: number;
  neon: string;
  castShadows: boolean;
  x: number;
  z: number;
}) {
  const facade = useMemo(() => buildingFacadeTexture(seed), [seed]);
  const mat = useMemo(() => resortShellMaterial(facade, neon), [facade, neon]);

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow={castShadows} receiveShadow={castShadows}>
        <boxGeometry args={[w, h, d]} />
        <primitive object={mat} attach="material" />
      </mesh>
      <NeonMarquee width={w * 0.92} color={neon} y={h * 0.55} z={d / 2 + 0.08} />
      <NeonMarquee width={w * 0.75} color="#ffd166" y={h * 0.82} z={d / 2 + 0.08} />
      {seed % 2 === 0 ? (
        <pointLight position={[0, h * 0.65, d * 0.55]} color={neon} intensity={0.35} distance={14} decay={2} />
      ) : null}
    </group>
  );
}

function EiffelLandmark({ neon, scale }: { neon: string; scale: number }) {
  const gold = "#ffb347";
  return (
    <group scale={scale}>
      {Array.from({ length: 8 }, (_, i) => {
        const t = i / 7;
        const w = 1.8 * (1 - t * 0.82);
        const y = 0.35 + i * 0.55;
        return (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[w, 0.22, w * 0.85]} />
            <meshBasicMaterial color={i > 5 ? gold : neon} toneMapped={false} />
          </mesh>
        );
      })}
      <mesh position={[0, 4.6, 0]}>
        <coneGeometry args={[0.12, 0.5, 4]} />
        <meshBasicMaterial color={gold} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 4.2, 0.5]} color={gold} intensity={1.2} distance={18} decay={2} />
    </group>
  );
}

function WheelLandmark({ neon }: { neon: string }) {
  const ringRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ringRef.current) ringRef.current.rotation.z = clock.elapsedTime * 0.15;
  });
  return (
    <group>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.1, 0.14, 10, 48]} />
        <meshBasicMaterial color={neon} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.1, 0.04, 8, 48]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} transparent opacity={0.35} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 2.1, Math.sin(a) * 2.1, 0]}>
            <boxGeometry args={[0.08, 0.5, 0.08]} />
            <meshBasicMaterial color={i % 2 ? neon : "#4de8ff"} toneMapped={false} />
          </mesh>
        );
      })}
      <pointLight position={[0, 1, 1]} color={neon} intensity={0.9} distance={16} decay={2} />
    </group>
  );
}

function PyramidLandmark({ neon }: { neon: string }) {
  return (
    <group>
      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[2.4, 3.6, 4]} />
        <meshStandardMaterial color="#1a1020" roughness={0.85} emissive={neon} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0, 2.2, 1.05]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2.2, 0.5]} />
        <meshBasicMaterial color={neon} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.5, 1.2]} color={neon} intensity={0.55} distance={14} decay={2} />
    </group>
  );
}

function ArchLandmark({ neon, neon2 }: { neon: string; neon2: string }) {
  return (
    <group>
      <mesh position={[-1.1, 1.5, 0]}>
        <boxGeometry args={[0.35, 3, 0.5]} />
        <meshBasicMaterial color={neon} toneMapped={false} />
      </mesh>
      <mesh position={[1.1, 1.5, 0]}>
        <boxGeometry args={[0.35, 3, 0.5]} />
        <meshBasicMaterial color={neon} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <boxGeometry args={[2.6, 0.35, 0.55]} />
        <meshBasicMaterial color={neon2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 2.5, 0.6]} color={neon2} intensity={0.65} distance={12} decay={2} />
    </group>
  );
}

function TowerLandmark({ neon }: { neon: string }) {
  return (
    <group>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.9, 1.2, 5, 8]} />
        <meshStandardMaterial color="#0c0814" roughness={0.88} emissive={neon} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 5.1, 0]}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshBasicMaterial color={neon} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 5, 0.4]} color={neon} intensity={0.85} distance={15} decay={2} />
    </group>
  );
}

function Landmark({ layout, mobile }: { layout: VegasSegmentLayout; mobile: boolean }) {
  const scale = mobile ? 0.85 : 1;
  const y = 0;
  const z = 0;
  return (
    <group position={[0, y, z]}>
      {layout.landmark === "eiffel" && <EiffelLandmark neon={layout.neon} scale={scale} />}
      {layout.landmark === "wheel" && <WheelLandmark neon={layout.neon} />}
      {layout.landmark === "pyramid" && <PyramidLandmark neon={layout.neon} />}
      {layout.landmark === "arch" && <ArchLandmark neon={layout.neon} neon2={layout.neon2} />}
      {layout.landmark === "tower" && <TowerLandmark neon={layout.neon} />}
    </group>
  );
}

function FountainGlow({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.PointLight>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.intensity = 0.35 + Math.sin(clock.elapsedTime * 2.2) * 0.12;
    }
  });
  return (
    <group position={[x, 0.05, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 24]} />
        <meshBasicMaterial color="#3a7ca5" transparent opacity={0.22} toneMapped={false} />
      </mesh>
      <pointLight ref={ref} color="#6ec8ff" intensity={0.4} distance={10} decay={2} position={[0, 0.5, 0]} />
    </group>
  );
}

function VegasSegment({
  layout,
  index,
  mobile,
  castShadows,
}: {
  layout: VegasSegmentLayout;
  index: number;
  mobile: boolean;
  castShadows: boolean;
}) {
  const side = layout.sideOffset;

  return (
    <group position={[0, 0, layout.z]}>
      <group position={[0, 0, -2]}>
        <Landmark layout={layout} mobile={mobile} />
      </group>

      <ResortBlock
        w={3.2}
        h={5.5 + vegasSeed(index, 3) * 3}
        d={2.8}
        seed={index * 3 + 1}
        neon={layout.neon}
        castShadows={castShadows}
        x={-side}
        z={1.5}
      />
      <ResortBlock
        w={2.8}
        h={4.5 + vegasSeed(index, 5) * 2.5}
        d={2.4}
        seed={index * 3 + 2}
        neon={layout.neon2}
        castShadows={castShadows}
        x={side}
        z={2}
      />
      <ResortBlock
        w={4}
        h={6 + vegasSeed(index, 7) * 2}
        d={3}
        seed={index * 3 + 3}
        neon={layout.neon2}
        castShadows={castShadows}
        x={-side * 0.55}
        z={-3}
      />

      {!mobile && layout.landmark === "eiffel" ? (
        <FountainGlow x={-4} z={4} />
      ) : null}

      {/* Future user video plane — keep slot, invisible until wired up */}
      <mesh position={[0, 8, -6]} visible={false} name="vegas-video-slot">
        <planeGeometry args={[40, 18]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
}

/**
 * Procedural Las Vegas strip — 3D neon resorts and landmarks (no photo backdrop).
 */
export function VegasStrip3D({
  segments = 5,
  mobile = false,
  castShadows = false,
}: Props) {
  const layouts = useMemo(() => layoutVegasSegments(segments, mobile), [segments, mobile]);

  return (
    <group name="vegas-strip-3d">
      {layouts.map((layout, i) => (
        <VegasSegment
          key={layout.z}
          layout={layout}
          index={i}
          mobile={mobile}
          castShadows={castShadows}
        />
      ))}
      {/* Distant glow plane — city haze, not a photo */}
      {layouts.map((layout, i) => (
        <mesh key={`haze-${layout.z}`} position={[0, 3, layout.z - 8]} renderOrder={-10}>
          <planeGeometry args={[mobile ? 38 : 48, 6]} />
          <meshBasicMaterial
            color={i % 2 === 0 ? "#ff4da6" : "#ffb347"}
            transparent
            opacity={0.06}
            toneMapped={false}
            depthWrite={false}
            fog
          />
        </mesh>
      ))}
    </group>
  );
}
