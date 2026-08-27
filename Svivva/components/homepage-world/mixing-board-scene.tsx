"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import {
  MIXING_BUSES,
  MASTER_BUS,
  PLATFORM_FEATURES,
  type MixingBusId,
  type PlatformFeature,
} from "@/lib/platform/feature-graph";

const BUS_TINT: Record<MixingBusId, string> = {
  seed: "#5B8DA8",
  build: "#4A8FA0",
  hybrid: "#5A9E8F",
  grow: "#6B9B7A",
  protect: "#C45C6A",
  play: "#D94F9C",
  advocate: "#B8864A",
};

const STRIP_W = 0.42;
const STRIP_GAP = 0.08;
const ROW_GAP = 1.15;

function visibleFeatures(): PlatformFeature[] {
  return PLATFORM_FEATURES.filter((f) => !f.adminOnly).sort((a, b) => a.channel - b.channel);
}

function layoutRows() {
  const features = visibleFeatures();
  return MIXING_BUSES.map((bus, rowIndex) => {
    const channels = features.filter((f) => f.bus === bus.id);
    const width = channels.length * (STRIP_W + STRIP_GAP) - STRIP_GAP;
    return { bus, channels, rowIndex, width: Math.max(width, 0.5) };
  }).filter((r) => r.channels.length > 0);
}

function ChannelStripMesh({
  feature,
  position,
  selected,
  onSelect,
}: {
  feature: PlatformFeature;
  position: [number, number, number];
  selected: boolean;
  onSelect: (f: PlatformFeature) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const fader = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const tint = BUS_TINT[feature.bus];
  const level = 0.35 + ((feature.channel * 17) % 50) / 100;

  useFrame((state) => {
    if (!fader.current) return;
    const t = state.clock.elapsedTime;
    const pulse =
      hovered || selected ? 0.08 * Math.sin(t * 4) : 0.03 * Math.sin(t * 1.6 + feature.channel);
    fader.current.position.y = -0.15 + level * 0.55 + pulse;
    if (group.current) {
      group.current.position.y = THREE.MathUtils.lerp(
        group.current.position.y,
        hovered || selected ? 0.04 : 0,
        0.12,
      );
    }
  });

  const pointerDown = useRef<{ x: number; y: number } | null>(null);

  const onPointer = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group
      ref={group}
      position={position}
      onPointerOver={onPointer}
      onPointerOut={onOut}
      onPointerDown={(e) => {
        e.stopPropagation();
        pointerDown.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        const start = pointerDown.current;
        pointerDown.current = null;
        if (!start) return;
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (dx * dx + dy * dy < 36) onSelect(feature);
      }}
    >
      {/* Invisible hit volume so orbit doesn't steal thin-strip clicks */}
      <mesh position={[0, 0.2, 0]} visible={false}>
        <boxGeometry args={[STRIP_W + 0.06, 0.55, 1.4]} />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[STRIP_W, 0.08, 1.35]} />
        <meshStandardMaterial
          color={selected || hovered ? "#2a3038" : "#1c2128"}
          metalness={0.55}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 0.07, -0.55]}>
        <boxGeometry args={[STRIP_W * 0.9, 0.04, 0.12]} />
        <meshStandardMaterial
          color={tint}
          emissive={tint}
          emissiveIntensity={selected ? 0.55 : 0.22}
        />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[0.12, 0.1, -0.25 + i * 0.12]}>
          <boxGeometry args={[0.06, 0.03, 0.08]} />
          <meshStandardMaterial
            color={i < level * 5 ? tint : "#333840"}
            emissive={i < level * 5 ? tint : "#000000"}
            emissiveIntensity={i < level * 5 ? 0.45 : 0}
          />
        </mesh>
      ))}
      <mesh position={[-0.08, 0.08, 0.15]}>
        <boxGeometry args={[0.06, 0.04, 0.7]} />
        <meshStandardMaterial color="#0e1116" metalness={0.3} roughness={0.6} />
      </mesh>
      <mesh ref={fader} position={[-0.08, 0.12, 0.15]} castShadow>
        <boxGeometry args={[0.14, 0.06, 0.18]} />
        <meshStandardMaterial
          color={
            feature.mainBus === "crest"
              ? "#D94F9C"
              : feature.mainBus === "both"
                ? "#C4A35A"
                : "#5B8DA8"
          }
          metalness={0.35}
          roughness={0.35}
        />
      </mesh>
      <mesh position={[0.1, 0.12, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.05, 16]} />
        <meshStandardMaterial color="#3a414c" metalness={0.7} roughness={0.25} />
      </mesh>
      <Html
        position={[0, 0.22, -0.62]}
        center
        distanceFactor={8}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div
          className="text-center leading-tight"
          style={{
            minWidth: 52,
            color: selected || hovered ? "#fff" : "rgba(255,255,255,0.72)",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          }}
        >
          <div style={{ fontSize: 8, letterSpacing: "0.14em", opacity: 0.7 }}>
            {feature.channelLabel}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700 }}>{feature.shortTitle}</div>
        </div>
      </Html>
    </group>
  );
}

function MasterSection({ position }: { position: [number, number, number] }) {
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((s) => {
    if (glow.current) {
      glow.current.emissiveIntensity = 0.25 + Math.sin(s.clock.elapsedTime * 2) * 0.1;
    }
  });
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.1, 0.12, 1.5]} />
        <meshStandardMaterial color="#241c14" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.1, -0.5]}>
        <boxGeometry args={[0.9, 0.05, 0.2]} />
        <meshStandardMaterial
          ref={glow}
          color="#D4A017"
          emissive="#D4A017"
          emissiveIntensity={0.3}
          metalness={0.4}
          roughness={0.4}
        />
      </mesh>
      <Html position={[0, 0.28, -0.55]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div
          style={{
            color: "#F5D76E",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontFamily: "ui-monospace, Menlo, monospace",
          }}
        >
          {MASTER_BUS.consoleName}
        </div>
      </Html>
      {MASTER_BUS.outputs.slice(0, 4).map((out, i) => (
        <mesh key={out} position={[-0.3 + (i % 2) * 0.55, 0.12, 0.05 + Math.floor(i / 2) * 0.35]}>
          <boxGeometry args={[0.4, 0.04, 0.22]} />
          <meshStandardMaterial color="#3a2e1a" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Desk({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (f: PlatformFeature) => void;
}) {
  const rows = useMemo(() => layoutRows(), []);
  const maxWidth = Math.max(...rows.map((r) => r.width), 2);
  const deskW = maxWidth + 2.4;
  const deskD = rows.length * ROW_GAP + 1.2;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color="#12151a" metalness={0.1} roughness={0.95} />
      </mesh>

      <mesh position={[0, -0.12, deskD * 0.12]} castShadow receiveShadow>
        <boxGeometry args={[deskW, 0.28, deskD]} />
        <meshStandardMaterial color="#161a20" metalness={0.65} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.04, deskD * 0.12 - deskD / 2 + 0.08]}>
        <boxGeometry args={[deskW * 0.98, 0.06, 0.12]} />
        <meshStandardMaterial
          color="#5B8DA8"
          metalness={0.5}
          roughness={0.4}
          emissive="#5B8DA8"
          emissiveIntensity={0.15}
        />
      </mesh>

      {rows.map(({ bus, channels, rowIndex, width }) => {
        const z = deskD * 0.12 - deskD / 2 + 0.85 + rowIndex * ROW_GAP;
        const startX = -width / 2 + STRIP_W / 2;
        return (
          <group key={bus.id}>
            <Html
              position={[startX - STRIP_W * 0.15, 0.55, z - 0.55]}
              center
              distanceFactor={9}
              style={{ pointerEvents: "none" }}
              zIndexRange={[20, 0]}
            >
              <div
                style={{
                  color: BUS_TINT[bus.id],
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  fontFamily: "ui-monospace, Menlo, monospace",
                  opacity: 0.95,
                  background: "rgba(8,10,14,0.72)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: `1px solid ${BUS_TINT[bus.id]}55`,
                }}
              >
                {bus.consoleName}
              </div>
            </Html>
            {channels.map((feature, i) => (
              <ChannelStripMesh
                key={feature.id}
                feature={feature}
                position={[startX + i * (STRIP_W + STRIP_GAP), 0.06, z]}
                selected={selectedId === feature.id}
                onSelect={onSelect}
              />
            ))}
          </group>
        );
      })}

      <MasterSection position={[deskW / 2 - 0.85, 0.06, deskD * 0.12]} />
    </group>
  );
}

function CameraBreathing() {
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    state.camera.position.y = THREE.MathUtils.lerp(
      state.camera.position.y,
      4.2 + Math.sin(t * 0.35) * 0.12,
      0.04,
    );
  });
  return null;
}

export type MixingBoardSceneProps = {
  selectedId: string | null;
  onSelect: (f: PlatformFeature | null) => void;
  className?: string;
};

export function MixingBoardScene({ selectedId, onSelect, className = "" }: MixingBoardSceneProps) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 4.4, 7.2], fov: 42, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        onPointerMissed={() => onSelect(null)}
      >
        <color attach="background" args={["#0c0e12"]} />
        <fog attach="fog" args={["#0c0e12", 12, 28]} />
        <ambientLight intensity={0.45} />
        <directionalLight
          castShadow
          position={[6, 10, 4]}
          intensity={1.15}
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-5, 4, -3]} intensity={0.35} color="#5B8DA8" />
        <directionalLight position={[4, 3, -2]} intensity={0.25} color="#D94F9C" />
        <Suspense fallback={null}>
          <Desk selectedId={selectedId} onSelect={onSelect} />
          <ContactShadows position={[0, -0.34, 0]} opacity={0.45} scale={22} blur={2.4} far={8} />
        </Suspense>
        <CameraBreathing />
        <OrbitControls
          makeDefault
          enablePan={false}
          minPolarAngle={0.35}
          maxPolarAngle={1.25}
          minDistance={4.5}
          maxDistance={14}
          target={[0, 0.2, 0.8]}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  );
}
