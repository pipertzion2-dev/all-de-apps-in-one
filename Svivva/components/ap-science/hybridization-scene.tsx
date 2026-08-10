"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { MoleculeSpec } from "@/lib/ap-science/chemistry/hybridization-model";

const ELEMENT_COLOR: Record<string, string> = {
  C: "#4b5563",
  H: "#e5e7eb",
  O: "#ef4444",
  N: "#3b82f6",
  B: "#f59e0b",
  F: "#22c55e",
};

type ViewMode = "ball_stick" | "orbitals" | "domains";

function AtomMesh({
  position,
  element,
  label,
  showLabel,
}: {
  position: [number, number, number];
  element: string;
  label?: string;
  showLabel: boolean;
}) {
  const color = ELEMENT_COLOR[element] ?? "#94a3b8";
  const r = element === "H" ? 0.22 : 0.38;
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[r, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      {showLabel && (
        <Html distanceFactor={8} center>
          <span className="text-[10px] font-bold text-foreground/90 bg-background/80 px-1 rounded border border-border/40">
            {label ?? element}
          </span>
        </Html>
      )}
    </group>
  );
}

function BondMesh({
  a,
  b,
  order,
}: {
  a: [number, number, number];
  b: [number, number, number];
  order: 1 | 2 | 3;
}) {
  const { mid, quat, len } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const length = dir.length();
    const midpoint = new THREE.Vector3().addVectors(va, vb).multiplyScalar(0.5);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { mid: midpoint.toArray() as [number, number, number], quat: quaternion, len: length };
  }, [a, b]);

  const offsets = order === 1 ? [0] : order === 2 ? [-0.08, 0.08] : [-0.12, 0, 0.12];

  return (
    <group position={mid} quaternion={quat}>
      {offsets.map((off, i) => (
        <mesh key={i} position={[off, 0, 0]}>
          <cylinderGeometry
            args={[
              order > 1 && i === 1 && order === 3 ? 0.05 : 0.06,
              order > 1 && i === 1 && order === 3 ? 0.05 : 0.06,
              len,
              16,
            ]}
          />
          <meshStandardMaterial
            color={i === 0 || order === 1 ? "#94a3b8" : "#38bdf8"}
            roughness={0.4}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

function OrbitalLobes({ molecule }: { molecule: MoleculeSpec }) {
  const focus = molecule.atoms.find((a) => a.id === molecule.focusAtomId);
  if (!focus) return null;
  const hybrids = molecule.hybridization;
  const count = hybrids === "sp" ? 2 : hybrids === "sp2" ? 3 : 4;
  const dirs: [number, number, number][] = [];
  if (count === 2) {
    dirs.push([-1, 0, 0], [1, 0, 0]);
  } else if (count === 3) {
    dirs.push([1, 0, 0], [-0.5, 0.866, 0], [-0.5, -0.866, 0]);
  } else {
    dirs.push([1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]);
  }
  return (
    <group position={focus.position}>
      {dirs.map((d, i) => {
        const n = Math.hypot(d[0], d[1], d[2]) || 1;
        const dir = new THREE.Vector3(d[0] / n, d[1] / n, d[2] / n);
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        return (
          <mesh key={i} position={dir.clone().multiplyScalar(0.7).toArray()} quaternion={quat}>
            <sphereGeometry args={[0.35, 24, 24]} />
            <meshStandardMaterial color="#38bdf8" transparent opacity={0.35} roughness={0.2} />
          </mesh>
        );
      })}
      {(hybrids === "sp2" || hybrids === "sp") && (
        <mesh position={[0, 0, 0.9]}>
          <sphereGeometry args={[0.28, 20, 20]} />
          <meshStandardMaterial color="#a78bfa" transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  );
}

function DomainMarkers({ molecule }: { molecule: MoleculeSpec }) {
  const focus = molecule.atoms.find((a) => a.id === molecule.focusAtomId);
  if (!focus) return null;
  const markers: [number, number, number][] = molecule.bonds
    .filter((b) => b.a === focus.id || b.b === focus.id)
    .map((b) => {
      const otherId = b.a === focus.id ? b.b : b.a;
      const other = molecule.atoms.find((a) => a.id === otherId)!;
      const mid: [number, number, number] = [
        (focus.position[0] + other.position[0]) / 2,
        (focus.position[1] + other.position[1]) / 2,
        (focus.position[2] + other.position[2]) / 2,
      ];
      return mid;
    });
  // Pedagogical lone-pair markers (approximate upward)
  for (let i = 0; i < molecule.lonePairs; i++) {
    markers.push([
      focus.position[0] + (i === 0 ? 0.2 : -0.2),
      focus.position[1] + 1.1,
      focus.position[2] + (i === 0 ? 0.3 : -0.3),
    ]);
  }
  return (
    <group>
      {markers.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function MoleculeGroup({
  molecule,
  mode,
  showLabels,
}: {
  molecule: MoleculeSpec;
  mode: ViewMode;
  showLabels: boolean;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.15;
  });
  const byId = useMemo(() => {
    const m = new Map<string, [number, number, number]>();
    molecule.atoms.forEach((a) => m.set(a.id, a.position));
    return m;
  }, [molecule]);

  return (
    <group ref={ref}>
      {molecule.atoms.map((a) => (
        <AtomMesh
          key={a.id}
          position={a.position}
          element={a.element}
          label={a.id === molecule.focusAtomId ? `${a.element}*` : a.element}
          showLabel={showLabels}
        />
      ))}
      {molecule.bonds.map((b, i) => (
        <BondMesh key={i} a={byId.get(b.a)!} b={byId.get(b.b)!} order={b.order} />
      ))}
      {mode === "orbitals" && <OrbitalLobes molecule={molecule} />}
      {mode === "domains" && <DomainMarkers molecule={molecule} />}
    </group>
  );
}

export function HybridizationScene({
  molecule,
  mode,
  showLabels,
  className,
}: {
  molecule: MoleculeSpec;
  mode: ViewMode;
  showLabels: boolean;
  className?: string;
}) {
  return (
    <div
      className={
        className ??
        "w-full h-[320px] sm:h-[420px] rounded-xl overflow-hidden border border-border/50 bg-[#0b1220]"
      }
    >
      <Canvas camera={{ position: [0, 1.4, 5.2], fov: 42 }} dpr={[1, 1.75]}>
        <color attach="background" args={["#0b1220"]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 3]} intensity={1.1} />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} />
        <MoleculeGroup molecule={molecule} mode={mode} showLabels={showLabels} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={9} />
      </Canvas>
    </div>
  );
}

export type { ViewMode };
