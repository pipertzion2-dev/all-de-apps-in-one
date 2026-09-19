"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { CleanSneaksPostFX } from "../CleanSneaksPostFX";

type Mode = "exterior" | "entering" | "interior" | "table";

type Props = {
  mode: Mode;
  doorsOpen: number;
  cameraPunch?: number;
  className?: string;
};

function NeonSign({
  text,
  position,
  color,
}: {
  text: string;
  position: [number, number, number];
  color: string;
}) {
  const tex = useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.font = "bold 120px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = 28;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }, [text, color]);

  const w = Math.max(2.4, text.length * 0.32);
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[w, 0.55]} />
        <meshBasicMaterial
          map={tex ?? undefined}
          color={tex ? undefined : color}
          transparent
          toneMapped={false}
        />
      </mesh>
      <pointLight color={color} intensity={2.2} distance={8} position={[0, 0, 0.6]} />
    </group>
  );
}

function CasinoExterior({ doorsOpen }: { doorsOpen: number }) {
  const leftDoor = useRef<THREE.Mesh>(null);
  const rightDoor = useRef<THREE.Mesh>(null);
  const marquee = useRef<THREE.Group>(null);
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    if (leftDoor.current) leftDoor.current.rotation.y = -doorsOpen * 1.35;
    if (rightDoor.current) rightDoor.current.rotation.y = doorsOpen * 1.35;
    if (marquee.current) {
      marquee.current.children.forEach((child, i) => {
        const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (m?.emissiveIntensity != null) {
          m.emissiveIntensity = 0.7 + Math.sin(t.current * 4 + i) * 0.55;
        }
      });
    }
  });

  const gold = "#d4af37";
  const burgundy = "#7a1028";

  return (
    <group>
      {/* Building */}
      <mesh position={[0, 3.2, -6]} castShadow receiveShadow>
        <boxGeometry args={[14, 7, 4]} />
        <meshStandardMaterial color="#1a0a10" metalness={0.35} roughness={0.55} />
      </mesh>
      {/* Gold trim */}
      <mesh position={[0, 6.6, -4.1]}>
        <boxGeometry args={[14.4, 0.25, 0.3]} />
        <meshStandardMaterial
          color={gold}
          metalness={0.8}
          roughness={0.25}
          emissive={gold}
          emissiveIntensity={0.25}
        />
      </mesh>
      <NeonSign text="CASINO" position={[0, 5.6, -3.9]} color="#ff3b6b" />
      <NeonSign text="KLEAN" position={[-3.4, 4.7, -3.9]} color="#ffd76a" />
      <NeonSign text="NIGHTS" position={[3.4, 4.7, -3.9]} color="#5cf0ff" />

      {/* Marquee bulbs */}
      <group ref={marquee} position={[0, 4.05, -3.85]}>
        {Array.from({ length: 18 }, (_, i) => (
          <mesh key={i} position={[-4.2 + i * 0.5, 0, 0]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial
              color="#ffe08a"
              emissive="#ffe08a"
              emissiveIntensity={1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Entrance frame */}
      <mesh position={[0, 1.6, -4.05]}>
        <boxGeometry args={[4.4, 3.4, 0.35]} />
        <meshStandardMaterial color={burgundy} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Doors */}
      <mesh ref={leftDoor} position={[-1.05, 1.55, -3.85]} castShadow>
        <boxGeometry args={[2.0, 3.1, 0.12]} />
        <meshStandardMaterial color="#2a0f18" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh ref={rightDoor} position={[1.05, 1.55, -3.85]} castShadow>
        <boxGeometry args={[2.0, 3.1, 0.12]} />
        <meshStandardMaterial color="#2a0f18" metalness={0.5} roughness={0.35} />
      </mesh>

      {/* Velvet ropes */}
      {([-2.6, 2.6] as const).map((x) => (
        <group key={x} position={[x, 0, -2.2]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 0.9, 10]} />
            <meshStandardMaterial color={gold} metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[x > 0 ? -0.7 : 0.7, 0.75, 0.35]} rotation={[0, 0, x > 0 ? 0.35 : -0.35]}>
            <cylinderGeometry args={[0.035, 0.035, 1.5, 8]} />
            <meshStandardMaterial color="#6b1024" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Check-in podium */}
      <mesh position={[0, 0.55, -1.1]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.85, 1.1, 20]} />
        <meshStandardMaterial color="#1c1210" metalness={0.3} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.15, -1.1]}>
        <cylinderGeometry args={[0.72, 0.72, 0.08, 20]} />
        <meshStandardMaterial
          color={gold}
          metalness={0.9}
          roughness={0.2}
          emissive={gold}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#12080c" roughness={0.9} />
      </mesh>

      <Sparkles
        count={40}
        scale={[12, 6, 8]}
        size={2.5}
        speed={0.35}
        color="#ffd76a"
        position={[0, 3, -3]}
      />
      <SpotLightBeam />
    </group>
  );
}

function SpotLightBeam() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = 0.08 + Math.sin(clock.elapsedTime * 1.4) * 0.04;
  });
  return (
    <mesh ref={ref} position={[0, 4.5, -2]} rotation={[0.35, 0, 0]}>
      <coneGeometry args={[1.8, 6, 24, 1, true]} />
      <meshBasicMaterial
        color="#ffd76a"
        transparent
        opacity={0.1}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function CasinoInterior({ highlightTable }: { highlightTable: boolean }) {
  const lampPulse = useRef(0);
  const lamps = useRef<THREE.PointLight[]>([]);

  useFrame((_, dt) => {
    lampPulse.current += dt;
    lamps.current.forEach((l, i) => {
      if (l) l.intensity = 1.1 + Math.sin(lampPulse.current * 2 + i) * 0.25;
    });
  });

  return (
    <group>
      {/* Room */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[18, 5, 14]} />
        <meshStandardMaterial color="#0c0a0e" side={THREE.BackSide} roughness={0.95} />
      </mesh>

      {/* Carpet */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#3a0d18" roughness={0.85} />
      </mesh>

      {/* Main felt table */}
      <group position={[0, 0.9, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[2.6, 2.8, 0.35, 48]} />
          <meshStandardMaterial color="#0d4a2f" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <torusGeometry args={[2.55, 0.08, 8, 48]} />
          <meshStandardMaterial color="#d4af37" metalness={0.85} roughness={0.25} />
        </mesh>
        {highlightTable && (
          <pointLight color="#ffd76a" intensity={2.4} distance={7} position={[0, 1.2, 0]} />
        )}
      </group>

      {/* Hanging lights */}
      {([-3.5, 0, 3.5] as const).map((x, i) => (
        <group key={x} position={[x, 3.6, -1 + (i % 2) * 1.5]}>
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 1.2, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, -0.7, 0]}>
            <sphereGeometry args={[0.22, 12, 12]} />
            <meshStandardMaterial
              color="#ffe6a8"
              emissive="#ffc857"
              emissiveIntensity={1.2}
              toneMapped={false}
            />
          </mesh>
          <pointLight
            ref={(el) => {
              if (el) lamps.current[i] = el;
            }}
            color="#ffd9a0"
            intensity={1.2}
            distance={8}
            position={[0, -0.7, 0]}
          />
        </group>
      ))}

      {/* Slot silhouettes */}
      {([-6, -4.5, 4.5, 6] as const).map((x, i) => (
        <mesh key={x} position={[x, 1.1, -4.5]}>
          <boxGeometry args={[0.9, 2.2, 0.7]} />
          <meshStandardMaterial
            color="#1a1018"
            emissive={i % 2 ? "#ff2d6a" : "#3de0ff"}
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}

      {/* Neon wall sign */}
      <NeonSign text="STEAL THE BUNDLE" position={[0, 3.2, -6.5]} color="#ff4d7a" />

      <Sparkles
        count={28}
        scale={[14, 4, 10]}
        size={2}
        speed={0.2}
        color="#d4af37"
        position={[0, 2, 0]}
      />
    </group>
  );
}

function CameraDirector({ mode, punch }: { mode: Mode; punch: number }) {
  const target = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(0, 2.2, 6));

  useFrame((state, dt) => {
    const goals: Record<Mode, { p: [number, number, number]; l: [number, number, number] }> = {
      exterior: { p: [0, 2.4, 5.5], l: [0, 1.8, -3] },
      entering: { p: [0, 1.8, 0.4], l: [0, 1.5, -4] },
      interior: { p: [0, 3.2, 6.2], l: [0, 1.2, 0] },
      table: { p: [0, 4.4, 4.2], l: [0, 1.0, 0] },
    };
    const g = goals[mode];
    pos.current.lerp(new THREE.Vector3(...g.p), Math.min(1, dt * 1.6));
    target.current.lerp(new THREE.Vector3(...g.l), Math.min(1, dt * 1.8));
    const shake = punch * 0.08;
    state.camera.position.set(
      pos.current.x + (Math.random() - 0.5) * shake,
      pos.current.y + (Math.random() - 0.5) * shake,
      pos.current.z,
    );
    state.camera.lookAt(target.current);
  });

  return null;
}

function SceneContent({ mode, doorsOpen, cameraPunch }: Omit<Props, "className">) {
  const showExterior = mode === "exterior" || mode === "entering";
  return (
    <>
      <color attach="background" args={["#07050a"]} />
      <fog attach="fog" args={["#10060c", 8, 28]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 8, 5]} intensity={0.85} castShadow color="#fff0d8" />
      <hemisphereLight args={["#ffb8d0", "#1a0810", 0.35]} />
      <CameraDirector mode={mode} punch={cameraPunch ?? 0} />
      {showExterior ? (
        <CasinoExterior doorsOpen={doorsOpen} />
      ) : (
        <CasinoInterior highlightTable={mode === "table"} />
      )}
      <CleanSneaksPostFX mobile={false} enabled />
    </>
  );
}

export function CasinoScene({ mode, doorsOpen, cameraPunch = 0, className }: Props) {
  return (
    <div className={className ?? "absolute inset-0"} data-testid="casino-scene">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [0, 2.4, 5.5], fov: 46, near: 0.1, far: 80 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.setClearColor("#07050a");
        }}
      >
        <SceneContent mode={mode} doorsOpen={doorsOpen} cameraPunch={cameraPunch} />
      </Canvas>
    </div>
  );
}
