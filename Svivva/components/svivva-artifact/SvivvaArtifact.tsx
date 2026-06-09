"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { ARTIFACT_FEATURES, type ArtworkFeature } from "./feature-data";

// ─── Cube face geometry ───────────────────────────────────────────────
function CubeFace({
  feature,
  faceIndex,
  isActive,
  onClick,
}: {
  feature: ArtworkFeature;
  faceIndex: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);

  const [r, g, b] = feature.accentColorRgb.split(",").map(Number);
  const baseColor = new THREE.Color(r / 255, g / 255, b / 255);
  const brightColor = new THREE.Color(r / 200, g / 200, b / 200);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const target = isActive ? 0.95 : hovered ? 0.65 : 0.25;
    matRef.current.emissiveIntensity +=
      (target - matRef.current.emissiveIntensity) * delta * 6;
  });

  // Face normal directions for a unit cube
  const facePositions: [number, number, number][] = [
    [0.5, 0, 0],
    [-0.5, 0, 0],
    [0, 0.5, 0],
    [0, -0.5, 0],
    [0, 0, 0.5],
    [0, 0, -0.5],
  ];

  const faceRotations: [number, number, number][] = [
    [0, Math.PI / 2, 0],
    [0, -Math.PI / 2, 0],
    [-Math.PI / 2, 0, 0],
    [Math.PI / 2, 0, 0],
    [0, 0, 0],
    [0, Math.PI, 0],
  ];

  return (
    <mesh
      ref={meshRef}
      position={facePositions[faceIndex]}
      rotation={faceRotations[faceIndex]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={onClick}
    >
      <planeGeometry args={[0.98, 0.98]} />
      <meshStandardMaterial
        ref={matRef}
        color={baseColor}
        emissive={brightColor}
        emissiveIntensity={0.25}
        roughness={0.1}
        metalness={0.8}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ─── Edge glow wireframe ───────────────────────────────────────────────
function CubeEdges({ activeFeature }: { activeFeature: ArtworkFeature }) {
  const [r, g, b] = activeFeature.accentColorRgb.split(",").map(Number);
  const color = new THREE.Color(r / 255, g / 255, b / 255);
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));

  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color={color} linewidth={2} />
    </lineSegments>
  );
}

// ─── Orbit particles ──────────────────────────────────────────────────
function OrbitParticles({ activeFeature }: { activeFeature: ArtworkFeature }) {
  const ref = useRef<THREE.Points>(null);
  const count = 120;

  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const radius = 0.85 + Math.random() * 0.4;
    const height = (Math.random() - 0.5) * 0.8;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = height;
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const [r, g, b] = activeFeature.accentColorRgb.split(",").map(Number);
  const color = new THREE.Color(r / 255, g / 255, b / 255);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const angle = (i / count) * Math.PI * 2 + t * 0.2;
      const radius = 0.85 + 0.4 * Math.sin(phases[i] + t * 0.5);
      const height = (Math.sin(phases[i] + t * 0.3) * 0.4);
      pos.setXYZ(i, Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    }
    pos.needsUpdate = true;
    ref.current.rotation.y += 0.003;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.012} color={color} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// ─── Cube ─────────────────────────────────────────────────────────────
function ArtifactCube({
  activeIndex,
  onFaceSelect,
}: {
  activeIndex: number;
  onFaceSelect: (i: number) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0.3, y: 0 });
  const { gl, camera } = useThree();

  const faceTargetRotations: [number, number][] = [
    [0, -Math.PI / 2],
    [0, Math.PI / 2],
    [Math.PI / 2, 0],
    [-Math.PI / 2, 0],
    [0, 0],
    [0, Math.PI],
  ];

  // Snap to face
  const snapToFace = useCallback(
    (index: number) => {
      targetRotation.current.x = faceTargetRotations[index][0];
      targetRotation.current.y = faceTargetRotations[index][1];
      velocity.current = { x: 0, y: 0 };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    snapToFace(activeIndex);
  }, [activeIndex, snapToFace]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!isDragging.current) {
      velocity.current.x *= 0.95;
      velocity.current.y *= 0.95;
      if (Math.abs(velocity.current.x) < 0.0001 && Math.abs(velocity.current.y) < 0.0001) {
        // Magnetic snap
        groupRef.current.rotation.x +=
          (targetRotation.current.x - groupRef.current.rotation.x) * delta * 5;
        groupRef.current.rotation.y +=
          (targetRotation.current.y - groupRef.current.rotation.y) * delta * 5;
      } else {
        groupRef.current.rotation.x += velocity.current.x;
        groupRef.current.rotation.y += velocity.current.y;
      }
    }
  });

  const onPointerDown = (e: PointerEvent) => {
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    velocity.current = { x: 0, y: 0 };
    gl.domElement.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!isDragging.current || !groupRef.current) return;
    const dx = (e.clientX - lastPointer.current.x) * 0.005;
    const dy = (e.clientY - lastPointer.current.y) * 0.005;
    groupRef.current.rotation.y += dx;
    groupRef.current.rotation.x += dy;
    velocity.current = { x: dy * 0.5, y: dx * 0.5 };
    lastPointer.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);

  const activeFeature = ARTIFACT_FEATURES[activeIndex];

  return (
    <group ref={groupRef} rotation={[0.3, 0, 0]}>
      {ARTIFACT_FEATURES.map((f, i) => (
        <CubeFace
          key={f.id}
          feature={f}
          faceIndex={i}
          isActive={i === activeIndex}
          onClick={() => onFaceSelect(i)}
        />
      ))}
      <CubeEdges activeFeature={activeFeature} />
      <OrbitParticles activeFeature={activeFeature} />
    </group>
  );
}

// ─── Scene lights ─────────────────────────────────────────────────────
function SceneLights({ activeFeature }: { activeFeature: ArtworkFeature }) {
  const [r, g, b] = activeFeature.accentColorRgb.split(",").map(Number);
  const col = new THREE.Color(r / 255, g / 255, b / 255);
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 3]} intensity={1} />
      <pointLight position={[-3, 2, -2]} color={col} intensity={2} />
      <pointLight position={[2, -2, 3]} color={col} intensity={1} />
    </>
  );
}

// ─── Feature preview panel ────────────────────────────────────────────
function FeaturePreview({
  feature,
  onClose,
}: {
  feature: ArtworkFeature;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto"
    >
      <div
        className="relative rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10"
        style={{
          background: `linear-gradient(135deg, rgba(${feature.accentColorRgb},0.12) 0%, rgba(0,0,0,0.75) 100%)`,
          boxShadow: `0 0 60px rgba(${feature.accentColorRgb},0.2)`,
        }}
      >
        {/* Artwork image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={feature.artwork}
            alt={feature.artworkAlt}
            className="w-full h-full object-cover opacity-80"
            style={{ filter: `saturate(1.2) contrast(1.05)` }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85) 100%)`,
            }}
          />
          <span
            className="absolute bottom-3 left-4 text-[10px] tracking-[0.25em] uppercase font-mono"
            style={{ color: feature.accentColor }}
          >
            {feature.artworkAlt.split("—")[0].trim()}
          </span>
        </div>

        <div className="px-5 py-4">
          <h3 className="text-white font-semibold text-lg leading-tight">{feature.title}</h3>
          <p
            className="text-xs tracking-widest uppercase mt-0.5 mb-2"
            style={{ color: feature.accentColor }}
          >
            {feature.subtitle}
          </p>
          <p className="text-white/60 text-sm leading-relaxed">{feature.description}</p>
          <a
            href={feature.href}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-all hover:brightness-110"
            style={{
              background: `rgba(${feature.accentColorRgb},0.25)`,
              color: feature.accentColor,
              border: `1px solid rgba(${feature.accentColorRgb},0.4)`,
            }}
          >
            {feature.cta}
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────
export function SvivvaArtifact() {
  const [activeIndex, setActiveIndex] = useState(4); // "api" face front
  const [showPreview, setShowPreview] = useState(false);
  const activeFeature = ARTIFACT_FEATURES[activeIndex];

  const handleFaceSelect = (i: number) => {
    if (i === activeIndex) {
      setShowPreview((p) => !p);
    } else {
      setActiveIndex(i);
      setShowPreview(false);
    }
  };

  return (
    <section className="relative w-full py-28 flex flex-col items-center overflow-hidden">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20 transition-colors duration-1000"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(${activeFeature.accentColorRgb},0.35) 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <motion.div
        className="text-center mb-10 px-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
      >
        <span
          className="text-xs tracking-[0.3em] uppercase font-mono mb-3 block"
          style={{ color: activeFeature.accentColor }}
        >
          The Svivva Artifact
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Explore Every Dimension
        </h2>
        <p className="text-white/50 mt-2 text-sm max-w-xs mx-auto">
          Drag · rotate · flick · tap a face to discover
        </p>
      </motion.div>

      {/* Canvas + preview layout */}
      <div className="relative w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 px-4">
        {/* 3D Cube */}
        <div
          className="relative flex-shrink-0 rounded-3xl overflow-hidden"
          style={{ width: 320, height: 320 }}
        >
          <Canvas
            camera={{ position: [0, 0, 2.4], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: "transparent" }}
          >
            <Suspense fallback={null}>
              <SceneLights activeFeature={activeFeature} />
              <ArtifactCube activeIndex={activeIndex} onFaceSelect={handleFaceSelect} />
            </Suspense>
          </Canvas>
        </div>

        {/* Preview panel */}
        <div className="flex-1 min-w-0 w-full md:w-auto pointer-events-none">
          <AnimatePresence mode="wait">
            {showPreview ? (
              <FeaturePreview
                key={activeFeature.id}
                feature={activeFeature}
                onClose={() => setShowPreview(false)}
              />
            ) : (
              <motion.div
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center md:text-left"
              >
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: activeFeature.accentColor }}
                >
                  {activeFeature.title}
                </p>
                <p className="text-white/40 text-xs">Tap the active face to explore</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Feature indicators */}
      <div className="mt-10 flex items-center gap-3 relative z-10">
        {ARTIFACT_FEATURES.map((f, i) => (
          <button
            key={f.id}
            onClick={() => {
              setActiveIndex(i);
              setShowPreview(false);
            }}
            className="group flex flex-col items-center gap-1.5"
            title={f.title}
          >
            <div
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? 32 : 8,
                height: 8,
                background:
                  i === activeIndex
                    ? f.accentColor
                    : "rgba(255,255,255,0.2)",
                boxShadow:
                  i === activeIndex
                    ? `0 0 12px rgba(${f.accentColorRgb},0.6)`
                    : "none",
              }}
            />
            {i === activeIndex && (
              <span
                className="text-[9px] tracking-widest uppercase font-mono whitespace-nowrap"
                style={{ color: f.accentColor }}
              >
                {f.title}
              </span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}
