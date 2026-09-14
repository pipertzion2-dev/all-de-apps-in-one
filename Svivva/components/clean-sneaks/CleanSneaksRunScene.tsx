"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Stars } from "@react-three/drei";
import * as THREE from "three";
import { OBSTACLE_META, POWERUP_META } from "@/lib/clean-sneaks/constants";
import {
  laneWorldX,
  stepRunEngine,
  type RunEngineState,
  type RunObstacle,
} from "@/lib/clean-sneaks/run-engine";
import {
  createWalkingShoes3D,
  updateWalkingShoes3D,
  type WalkingShoes3D,
} from "@/lib/clean-sneaks/walking-shoes-3d";

type SceneProps = {
  stateRef: React.MutableRefObject<RunEngineState>;
  running: boolean;
  onGameOver: () => void;
  onStreakFlash: () => void;
  onStatsTick: () => void;
};

const ROAD_LENGTH = 120;
const ROAD_SEGMENTS = 8;
const SEG_LEN = ROAD_LENGTH / ROAD_SEGMENTS;

function FollowCamera({ stateRef }: { stateRef: React.MutableRefObject<RunEngineState> }) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 0.8, -18));
  const pos = useRef(new THREE.Vector3(0, 4.2, 9.5));

  useFrame((_, dt) => {
    const s = stateRef.current;
    const px = laneWorldX(s.laneX);
    const targetX = px * 0.35;
    pos.current.x = THREE.MathUtils.lerp(pos.current.x, targetX, Math.min(1, dt * 4));
    lookAt.current.x = THREE.MathUtils.lerp(lookAt.current.x, px * 0.55, Math.min(1, dt * 5));
    lookAt.current.y = 0.8 + (s.y < 0 ? -s.y / 120 : 0);

    const shake = s.shake * 0.015;
    camera.position.set(
      pos.current.x + (Math.random() - 0.5) * shake,
      pos.current.y + (Math.random() - 0.5) * shake,
      pos.current.z,
    );
    camera.lookAt(lookAt.current);
  });

  return null;
}

function Road({ stateRef }: { stateRef: React.MutableRefObject<RunEngineState> }) {
  const groupRef = useRef<THREE.Group>(null);
  const segments = useMemo(() => {
    return Array.from({ length: ROAD_SEGMENTS }, (_, i) => ({
      key: i,
      z: -ROAD_LENGTH / 2 + i * SEG_LEN + SEG_LEN / 2,
    }));
  }, []);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const offset = (stateRef.current.distance * 0.4) % SEG_LEN;
    g.position.z = offset;
  });

  return (
    <group ref={groupRef}>
      {segments.map((seg) => (
        <group key={seg.key} position={[0, 0, seg.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[8.5, SEG_LEN]} />
            <meshStandardMaterial color="#151a22" roughness={0.92} metalness={0.05} />
          </mesh>
          {[-2.4, 0, 2.4].map((lx) => (
            <mesh key={lx} position={[lx, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.6, SEG_LEN - 0.2]} />
              <meshStandardMaterial color="#1c222c" roughness={0.88} />
            </mesh>
          ))}
          <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.08, SEG_LEN]} />
            <meshStandardMaterial color="#5b8da8" emissive="#5b8da8" emissiveIntensity={0.15} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.05, -ROAD_LENGTH / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, ROAD_LENGTH * 2]} />
        <meshStandardMaterial color="#0a0c10" roughness={1} />
      </mesh>
    </group>
  );
}

function CitySilhouette() {
  const buildings = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => ({
      x: -18 + i * 2.8 + (i % 3) * 0.4,
      z: -35 - (i % 5) * 6,
      w: 1.2 + (i % 4) * 0.5,
      h: 3 + (i % 6) * 1.8,
    }));
  }, []);

  return (
    <group>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, 1.2]} />
          <meshStandardMaterial color="#0e1218" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function makeObstacleMesh(obstacle: RunObstacle): THREE.Object3D {
  const meta = OBSTACLE_META[obstacle.kind];
  const scaleW = meta.w / 40;
  const scaleH = meta.h / 20;
  const root = new THREE.Group();

  if (obstacle.kind === "pothole" || obstacle.kind === "mud" || obstacle.kind === "water") {
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.5 * scaleW, 16),
      new THREE.MeshStandardMaterial({ color: meta.color, roughness: 0.8 }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.06;
    root.add(mesh);
  } else if (obstacle.kind === "pedestrian") {
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 1.1, 0.25),
      new THREE.MeshStandardMaterial({ color: meta.color }),
    );
    body.position.y = 0.9;
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.28, 0.28),
      new THREE.MeshStandardMaterial({ color: "#1a1a1a" }),
    );
    head.position.y = 1.65;
    root.add(body, head);
  } else if (obstacle.kind === "bike") {
    const wheelA = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.04, 8, 20),
      new THREE.MeshStandardMaterial({ color: meta.color }),
    );
    wheelA.rotation.x = Math.PI / 2;
    const wheelB = wheelA.clone();
    wheelB.position.x = 0.55;
    root.position.y = 0.35;
    root.add(wheelA, wheelB);
  } else {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.7 * scaleW, 0.5 * scaleH, 0.6 * scaleW),
      new THREE.MeshStandardMaterial({ color: meta.color, roughness: 0.65 }),
    );
    mesh.position.y = 0.25 * scaleH;
    root.add(mesh);
  }

  return root;
}

function DynamicEntities({ stateRef }: { stateRef: React.MutableRefObject<RunEngineState> }) {
  const groupRef = useRef<THREE.Group>(null);
  const poolRef = useRef<Map<number, THREE.Object3D>>(new Map());
  const powerPoolRef = useRef<Map<number, THREE.Mesh>>(new Map());

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const s = stateRef.current;

    const activeObs = new Set(s.obstacles.map((o) => o.id));
    for (const [id, obj] of poolRef.current) {
      if (!activeObs.has(id)) {
        group.remove(obj);
        poolRef.current.delete(id);
      }
    }
    for (const o of s.obstacles) {
      let obj = poolRef.current.get(o.id);
      if (!obj) {
        obj = makeObstacleMesh(o);
        poolRef.current.set(o.id, obj);
        group.add(obj);
      }
      obj.position.set(laneWorldX(o.lane), 0, o.z);
      obj.visible = !(o.hit && o.z > 2);
      obj.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          const mat = c.material as THREE.MeshStandardMaterial;
          mat.transparent = o.hit;
          mat.opacity = o.hit ? 0.35 : 1;
        }
      });
    }

    const activePow = new Set(s.powerups.filter((p) => !p.taken).map((p) => p.id));
    for (const [id, mesh] of powerPoolRef.current) {
      if (!activePow.has(id)) {
        group.remove(mesh);
        powerPoolRef.current.delete(id);
      }
    }
    for (const p of s.powerups) {
      if (p.taken) continue;
      let mesh = powerPoolRef.current.get(p.id);
      if (!mesh) {
        const meta = POWERUP_META[p.kind];
        mesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 16, 16),
          new THREE.MeshStandardMaterial({
            color: meta.color,
            emissive: meta.color,
            emissiveIntensity: 0.65,
            roughness: 0.25,
          }),
        );
        powerPoolRef.current.set(p.id, mesh);
        group.add(mesh);
      }
      const bob = Math.sin(performance.now() / 200 + p.id) * 0.12;
      mesh.position.set(laneWorldX(p.lane), 0.85 + bob, p.z);
    }
  });

  return <group ref={groupRef} />;
}

function PlayerShoes({ stateRef }: { stateRef: React.MutableRefObject<RunEngineState> }) {
  const shoesRef = useRef<WalkingShoes3D | null>(null);
  const hostRef = useRef<THREE.Group>(null);

  useEffect(() => {
    shoesRef.current = createWalkingShoes3D();
    hostRef.current?.add(shoesRef.current.root);
    return () => {
      if (shoesRef.current && hostRef.current) {
        hostRef.current.remove(shoesRef.current.root);
      }
    };
  }, []);

  useFrame(() => {
    const s = stateRef.current;
    const host = hostRef.current;
    if (!host || !shoesRef.current) return;
    const now = performance.now();

    host.position.x = laneWorldX(s.laneX);
    host.position.y = s.y < 0 ? -s.y / 120 : 0;
    host.rotation.y = Math.sin(now / 120) * 0.03;

    updateWalkingShoes3D(shoesRef.current, {
      walkPhase: s.walkPhase,
      airborne: !s.grounded,
      dirt: 1 - s.cleanliness / 100,
      freshGlow: s.cleanliness >= 80,
      shieldActive: now < s.shieldUntil,
    });
  });

  return <group ref={hostRef} position={[0, 0, 0]} />;
}

function World({
  stateRef,
  running,
  onGameOver,
  onStreakFlash,
  onStatsTick,
}: SceneProps) {
  const tickRef = useRef(0);

  useFrame((_, rawDt) => {
    const s = stateRef.current;
    if (!running || !s.running) return;

    const ts = performance.now();
    const dt = Math.min(0.05, rawDt);
    stepRunEngine(s, dt, ts, { onGameOver, onStreakFlash });
    tickRef.current += dt;
    if (tickRef.current >= 0.1) {
      tickRef.current = 0;
      onStatsTick();
    }
  });

  return (
    <>
      <color attach="background" args={["#06080c"]} />
      <fog attach="fog" args={["#06080c", 18, 55]} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 12, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-4, 6, -8]} intensity={0.35} color="#7ec8d9" />
      <pointLight position={[0, 3, 2]} intensity={0.4} color="#d94f9c" />

      <FollowCamera stateRef={stateRef} />
      <Road stateRef={stateRef} />
      <CitySilhouette />
      <Stars radius={80} depth={40} count={800} factor={3} saturation={0} fade speed={0.6} />

      <PlayerShoes stateRef={stateRef} />
      <DynamicEntities stateRef={stateRef} />

      <Environment preset="city" environmentIntensity={0.25} />
    </>
  );
}

export type CleanSneaksRunSceneProps = SceneProps & {
  className?: string;
};

export function CleanSneaksRunScene({
  stateRef,
  running,
  onGameOver,
  onStreakFlash,
  onStatsTick,
  className = "",
}: CleanSneaksRunSceneProps) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className={`h-full w-full ${className}`} aria-hidden>
      <Canvas
        shadows
        dpr={[1, isMobile ? 1.5 : 2]}
        camera={{ fov: 52, near: 0.1, far: 120, position: [0, 4.2, 9.5] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        style={{ touchAction: "none" }}
      >
        <World
          stateRef={stateRef}
          running={running}
          onGameOver={onGameOver}
          onStreakFlash={onStreakFlash}
          onStatsTick={onStatsTick}
        />
      </Canvas>
    </div>
  );
}
