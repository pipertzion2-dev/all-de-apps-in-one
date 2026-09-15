"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Sky, Sparkles } from "@react-three/drei";
import { Baloon8RunEnvironment } from "./Baloon8RunEnvironment";
import * as THREE from "three";
import { POWERUP_META } from "@/lib/clean-sneaks/constants";
import { buildObstacle3D, buildPowerUp3D } from "@/lib/clean-sneaks/run-obstacles-3d";
import { laneWorldX, stepRunEngine, type RunEngineState } from "@/lib/clean-sneaks/run-engine";
import {
  asphaltMaterial,
  buildingFacadeTexture,
  laneDashTexture,
  sidewalkTexture,
  wetAsphaltMaterial,
} from "@/lib/clean-sneaks/run-textures";
import {
  detectRunQuality,
  isPortraitViewport,
  portraitFramingBoost,
  runQualityFlags,
  type RunQuality,
} from "@/lib/clean-sneaks/run-quality";
import {
  createWalkingShoes3D,
  preloadBaloon8RunnerShoe,
  updateWalkingShoes3D,
  type WalkingShoes3D,
} from "@/lib/clean-sneaks/walking-shoes-3d";
import { CleanSneaksPostFX } from "./CleanSneaksPostFX";

type QualityFlags = ReturnType<typeof runQualityFlags>;

type SceneProps = {
  stateRef: React.MutableRefObject<RunEngineState>;
  running: boolean;
  onGameOver: () => void;
  onStreakFlash: () => void;
  onStatsTick: () => void;
  quality: QualityFlags;
};

const ROAD_LENGTH = 140;
const ROAD_SEGMENTS = 10;
const SEG_LEN = ROAD_LENGTH / ROAD_SEGMENTS;

type CameraRig = { ox: number; oy: number; oz: number; lookY: number; lookZ: number; fov: number };

function cameraRigFor(mobile: boolean, portrait: boolean): CameraRig {
  if (mobile && portrait) {
    // Offset chase cam for a rear-quarter view so the coupe silhouette + wheels read
    const boost = portraitFramingBoost();
    return {
      ox: 1.15 * boost,
      oy: 1.35 * boost,
      oz: 3.4 * boost,
      lookY: 0.32,
      lookZ: -2.8,
      fov: 62 + (boost - 1) * 6,
    };
  }
  if (mobile) {
    return { ox: 2.65, oy: 1.35, oz: 2.55, lookY: 0.42, lookZ: -3.6, fov: 46 };
  }
  return { ox: 3.8, oy: 1.75, oz: 3.2, lookY: 0.5, lookZ: -5.2, fov: 40 };
}

function FollowCamera({
  stateRef,
  mobile,
  portrait,
}: {
  stateRef: React.MutableRefObject<RunEngineState>;
  mobile: boolean;
  portrait: boolean;
}) {
  const { camera } = useThree();
  const rigRef = useRef(cameraRigFor(mobile, portrait));
  const lookAt = useRef(new THREE.Vector3(0, rigRef.current.lookY, rigRef.current.lookZ));
  const pos = useRef(new THREE.Vector3(rigRef.current.ox, rigRef.current.oy, rigRef.current.oz));

  useEffect(() => {
    const rig = cameraRigFor(mobile, portrait);
    rigRef.current = rig;
    pos.current.set(rig.ox, rig.oy, rig.oz);
    lookAt.current.set(0, rig.lookY, rig.lookZ);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = rig.fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, mobile, portrait]);

  useFrame((_, dt) => {
    const s = stateRef.current;
    const rig = rigRef.current;
    const px = laneWorldX(s.laneX);
    const speedT = THREE.MathUtils.clamp(s.speed / 620, 0, 1);

    pos.current.x = THREE.MathUtils.lerp(pos.current.x, px + rig.ox, Math.min(1, dt * 4.5));
    lookAt.current.x = THREE.MathUtils.lerp(lookAt.current.x, px, Math.min(1, dt * 5.5));
    lookAt.current.y = THREE.MathUtils.lerp(
      lookAt.current.y,
      rig.lookY + (s.y < 0 ? -s.y / 120 : 0),
      dt * 6,
    );
    lookAt.current.z = THREE.MathUtils.lerp(lookAt.current.z, rig.lookZ - speedT * 2, dt * 3);
    pos.current.z = THREE.MathUtils.lerp(pos.current.z, rig.oz - speedT * 0.25, dt * 2);

    const shake = s.shake * 0.012;
    camera.position.set(
      pos.current.x + (Math.random() - 0.5) * shake,
      pos.current.y + (Math.random() - 0.5) * shake,
      pos.current.z,
    );
    camera.lookAt(lookAt.current);

    if (camera instanceof THREE.PerspectiveCamera) {
      const speedFov = portrait ? speedT * 3 : speedT * 6;
      const maxFov = portrait ? rig.fov + 4 : rig.fov + 8;
      camera.fov = THREE.MathUtils.lerp(camera.fov, Math.min(rig.fov + speedFov, maxFov), dt * 3);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function Road({
  stateRef,
  castShadows,
}: {
  stateRef: React.MutableRefObject<RunEngineState>;
  castShadows: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const asphalt = useMemo(() => asphaltMaterial(), []);
  const wet = useMemo(() => wetAsphaltMaterial(), []);
  const sidewalk = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: sidewalkTexture(),
        roughness: 0.88,
        metalness: 0.02,
      }),
    [],
  );
  const dash = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: laneDashTexture(),
        emissive: 0xe8ecf4,
        emissiveIntensity: 0.35,
        roughness: 0.4,
      }),
    [],
  );

  const segments = useMemo(
    () =>
      Array.from({ length: ROAD_SEGMENTS }, (_, i) => ({
        key: i,
        z: -ROAD_LENGTH / 2 + i * SEG_LEN + SEG_LEN / 2,
      })),
    [],
  );

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    g.position.z = (stateRef.current.distance * 0.4) % SEG_LEN;
  });

  return (
    <group ref={groupRef}>
      {segments.map((seg) => (
        <group key={seg.key} position={[0, 0, seg.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={castShadows} material={asphalt}>
            <planeGeometry args={[9.2, SEG_LEN]} />
          </mesh>
          {[-2.4, 0, 2.4].map((lx, li) => (
            <group key={lx}>
              <mesh
                position={[lx, 0.015, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow={castShadows}
                material={li === 1 ? wet : asphalt}
              >
                <planeGeometry args={[1.75, SEG_LEN - 0.15]} />
              </mesh>
              <mesh position={[lx, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} material={dash}>
                <planeGeometry args={[0.1, SEG_LEN]} />
              </mesh>
            </group>
          ))}
          <mesh
            position={[-4.8, 0.08, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow={castShadows}
            material={sidewalk}
          >
            <planeGeometry args={[1.6, SEG_LEN]} />
          </mesh>
          <mesh
            position={[4.8, 0.08, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow={castShadows}
            material={sidewalk}
          >
            <planeGeometry args={[1.6, SEG_LEN]} />
          </mesh>
          <mesh position={[-3.85, 0.12, 0]} castShadow={castShadows} receiveShadow={castShadows}>
            <boxGeometry args={[0.18, 0.24, SEG_LEN - 0.1]} />
            <meshStandardMaterial color="#3a424c" roughness={0.75} />
          </mesh>
          <mesh position={[3.85, 0.12, 0]} castShadow={castShadows} receiveShadow={castShadows}>
            <boxGeometry args={[0.18, 0.24, SEG_LEN - 0.1]} />
            <meshStandardMaterial color="#3a424c" roughness={0.75} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function StreetLights({ count }: { count: number }) {
  const positions = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: i % 2 === 0 ? -5.2 : 5.2,
        z: -12 - i * 11,
      })),
    [count],
  );

  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={[p.x, 0, p.z]}>
          <mesh position={[0, 2.2, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 4.4, 8]} />
            <meshStandardMaterial color="#2a3038" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 4.2, 0.15]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial
              color="#ffe8c8"
              emissive="#ffaa55"
              emissiveIntensity={2}
              roughness={0.2}
            />
          </mesh>
          {count >= 12 ? (
            <pointLight
              position={[0, 4, 0.3]}
              color="#ffcc88"
              intensity={0.35}
              distance={14}
              decay={2}
            />
          ) : null}
        </group>
      ))}
    </group>
  );
}

function CityBlock({ count, castShadows }: { count: number; castShadows: boolean }) {
  const buildings = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = i + 1;
      return {
        x: (i % 2 === 0 ? -1 : 1) * (7.5 + (i % 3) * 0.8),
        z: -28 - i * 9 - (i % 4) * 2,
        w: 2 + (i % 5) * 0.6,
        h: 4 + (i % 7) * 2.2,
        d: 2.5 + (i % 3) * 0.5,
        seed,
      };
    });
  }, [count]);

  return (
    <group>
      {buildings.map((b) => {
        const facade = buildingFacadeTexture(b.seed);
        return (
          <mesh
            key={`${b.x}-${b.z}`}
            position={[b.x, b.h / 2, b.z]}
            castShadow={castShadows}
            receiveShadow={castShadows}
          >
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              map={facade}
              roughness={0.82}
              metalness={0.08}
              emissive="#ffaa44"
              emissiveMap={facade}
              emissiveIntensity={0.35}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function SpeedStreaks({ stateRef }: { stateRef: React.MutableRefObject<RunEngineState> }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const speed = stateRef.current.speed;
    g.visible = speed > 320;
    g.children.forEach((child, i) => {
      child.position.z += speed * 0.00035 * dt * 60;
      if (child.position.z > 8) child.position.z = -40 - (i % 5) * 8;
    });
  });

  const streaks = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: (Math.random() - 0.5) * 14,
        y: 0.5 + Math.random() * 3,
        z: -40 - Math.random() * 30,
        len: 1.5 + Math.random() * 3,
      })),
    [],
  );

  return (
    <group ref={ref}>
      {streaks.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, s.z]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.015, 0.015, s.len]} />
          <meshBasicMaterial color="#7ec8d9" transparent opacity={0.12} />
        </mesh>
      ))}
    </group>
  );
}

function DynamicEntities({ stateRef }: { stateRef: React.MutableRefObject<RunEngineState> }) {
  const groupRef = useRef<THREE.Group>(null);
  const poolRef = useRef<Map<number, THREE.Object3D>>(new Map());
  const powerPoolRef = useRef<Map<number, THREE.Group>>(new Map());

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
        obj = buildObstacle3D(o.kind);
        poolRef.current.set(o.id, obj);
        group.add(obj);
      }
      obj.position.set(laneWorldX(o.lane), 0, o.z);
      obj.visible = !(o.hit && o.z > 2);
      obj.traverse((c) => {
        if (c instanceof THREE.Mesh) {
          const mat = c.material as THREE.MeshStandardMaterial;
          if (mat.transparent !== undefined) {
            mat.transparent = o.hit;
            mat.opacity = o.hit ? 0.35 : 1;
          }
        }
      });
    }

    const activePow = new Set(s.powerups.filter((p) => !p.taken).map((p) => p.id));
    for (const [id, obj] of powerPoolRef.current) {
      if (!activePow.has(id)) {
        group.remove(obj);
        powerPoolRef.current.delete(id);
      }
    }
    for (const p of s.powerups) {
      if (p.taken) continue;
      let obj = powerPoolRef.current.get(p.id);
      if (!obj) {
        const meta = POWERUP_META[p.kind];
        obj = buildPowerUp3D(meta.color);
        powerPoolRef.current.set(p.id, obj);
        group.add(obj);
      }
      const bob = Math.sin(performance.now() / 200 + p.id) * 0.14;
      obj.position.set(laneWorldX(p.lane), 0.9 + bob, p.z);
      obj.rotation.y += 0.025;
    }
  });

  return <group ref={groupRef} />;
}

function PlayerShoes({
  stateRef,
  mobile,
  portrait,
}: {
  stateRef: React.MutableRefObject<RunEngineState>;
  mobile: boolean;
  portrait: boolean;
}) {
  const hostRef = useRef<THREE.Group>(null);
  const shoes = useMemo(
    () => createWalkingShoes3D(undefined, mobile, portrait),
    [mobile, portrait],
  );

  useFrame(() => {
    const s = stateRef.current;
    const host = hostRef.current;
    if (!host || !shoes) return;
    const now = performance.now();

    host.position.x = laneWorldX(s.laneX);
    host.position.y = s.y < 0 ? -s.y / 120 : 0;
    host.rotation.y = portrait ? 0.18 : mobile ? 0.28 : 0.12;

    updateWalkingShoes3D(shoes, {
      walkPhase: s.walkPhase,
      airborne: !s.grounded,
      dirt: 1 - s.cleanliness / 100,
      freshGlow: s.cleanliness >= 80,
      shieldActive: now < s.shieldUntil,
      speed: s.speed,
      portrait,
    });
  });

  if (!shoes) return null;

  return (
    <group ref={hostRef}>
      <primitive object={shoes.root} />
      <pointLight
        position={[0, 0.75, 0.85]}
        intensity={mobile ? 3.2 : 1.4}
        distance={12}
        color="#9ed8e8"
      />
      <pointLight
        position={[1.6, 0.55, 0.7]}
        intensity={mobile ? 1.8 : 0.75}
        distance={9}
        color="#7ec8d9"
      />
      <pointLight
        position={[-1.2, 0.4, 0.45]}
        intensity={mobile ? 1.1 : 0.45}
        distance={7}
        color="#d94f9c"
      />
      <pointLight
        position={[0.2, 0.45, -0.9]}
        intensity={mobile ? 1.6 : 0.7}
        distance={8}
        color="#36f078"
      />
    </group>
  );
}

function World({ stateRef, running, onGameOver, onStreakFlash, onStatsTick, quality }: SceneProps) {
  const tickRef = useRef(0);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    scene.background = new THREE.Color(0x0a0e14);
  }, [scene]);

  useEffect(() => {
    let alive = true;
    preloadBaloon8RunnerShoe().finally(() => {
      if (alive) setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  useFrame((_, rawDt) => {
    const s = stateRef.current;
    if (running && s.running) {
      const ts = performance.now();
      const dt = Math.min(0.05, rawDt);
      stepRunEngine(s, dt, ts, { onGameOver, onStreakFlash });
      tickRef.current += dt;
      if (tickRef.current >= 0.1) {
        tickRef.current = 0;
        onStatsTick();
      }
    }

    if (sunRef.current) {
      sunRef.current.position.x = 8 + Math.sin(performance.now() / 8000) * 2;
    }
  });

  return (
    <>
      <fog attach="fog" args={["#0a0e18", 22, 68]} />

      {quality.sky ? (
        <Sky
          distance={450000}
          sunPosition={[8, 3, -20]}
          inclination={0.52}
          azimuth={0.28}
          mieCoefficient={0.012}
          mieDirectionalG={0.85}
          rayleigh={0.4}
          turbidity={8}
        />
      ) : null}

      <hemisphereLight args={["#7ec8d9", "#1a1420", 0.45]} />
      <ambientLight intensity={0.32} color="#ffffff" />
      <directionalLight
        ref={sunRef}
        castShadow={quality.castShadows}
        position={[6, 8, 4]}
        intensity={1.25}
        color="#ffffff"
        shadow-mapSize={
          quality.castShadows
            ? [quality.mobile ? 512 : 2048, quality.mobile ? 512 : 2048]
            : undefined
        }
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-4, 3, -6]} intensity={0.55} color="#7ec8d9" />
      <pointLight position={[-2, 2, 3]} intensity={0.45} color="#d94f9c" distance={18} />

      <Baloon8RunEnvironment lite={quality.pmremLite} />

      <FollowCamera stateRef={stateRef} mobile={quality.mobile} portrait={quality.portrait} />
      <Road stateRef={stateRef} castShadows={quality.castShadows} />
      <CityBlock count={quality.cityBuildings} castShadows={quality.castShadows} />
      <StreetLights count={quality.streetLights} />
      {quality.speedStreaks ? <SpeedStreaks stateRef={stateRef} /> : null}

      {quality.sparkles ? (
        <Sparkles
          count={quality.mobile ? 24 : 80}
          scale={[14, 6, 50]}
          size={1.2}
          speed={0.35}
          opacity={0.25}
          color="#7ec8d9"
        />
      ) : null}

      {ready ? (
        <PlayerShoes stateRef={stateRef} mobile={quality.mobile} portrait={quality.portrait} />
      ) : null}
      <DynamicEntities stateRef={stateRef} />

      {quality.contactShadows ? (
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.55}
          scale={12}
          blur={2.2}
          far={4}
          color="#000000"
          frames={Infinity}
          resolution={quality.mobile ? 128 : 512}
        />
      ) : null}

      <CleanSneaksPostFX mobile={quality.mobile} enabled={quality.postFx} />
    </>
  );
}

export type CleanSneaksRunSceneProps = Omit<SceneProps, "quality"> & {
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
  const [qualityTier, setQualityTier] = useState<RunQuality>("mobile");
  const [portrait, setPortrait] = useState(false);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const quality = useMemo(() => runQualityFlags(qualityTier, portrait), [qualityTier, portrait]);
  const portraitRig = useMemo(
    () => (portrait ? cameraRigFor(true, true) : null),
    [portrait, viewport.w, viewport.h],
  );

  useEffect(() => {
    setQualityTier(detectRunQuality());
    const syncViewport = () => {
      setPortrait(isPortraitViewport());
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", syncViewport);
    return () => {
      window.removeEventListener("resize", syncViewport);
      window.removeEventListener("orientationchange", syncViewport);
    };
  }, []);

  return (
    <div className={`h-full min-h-[240px] w-full ${className}`} aria-hidden>
      <Canvas
        className="!h-full !w-full"
        shadows={quality.castShadows}
        dpr={quality.dpr}
        camera={{
          fov: portraitRig?.fov ?? 48,
          near: 0.08,
          far: 140,
          position: portraitRig
            ? [portraitRig.ox, portraitRig.oy, portraitRig.oz]
            : [2.35, 1.05, 2.05],
        }}
        gl={{
          antialias: quality.antialias,
          powerPreference: quality.mobile ? "default" : "high-performance",
          alpha: false,
          stencil: false,
          failIfMajorPerformanceCaveat: false,
        }}
        style={{ touchAction: "none" }}
      >
        <World
          stateRef={stateRef}
          running={running}
          onGameOver={onGameOver}
          onStreakFlash={onStreakFlash}
          onStatsTick={onStatsTick}
          quality={quality}
        />
      </Canvas>
    </div>
  );
}
