"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MOVES_LIKE_HEX } from "@/lib/the-moves-like/brand";
import { getMove } from "@/lib/the-moves-like/moves-library";
import {
  sampleMovePose,
  sampleRoutinePose,
  type DancePose,
} from "@/lib/the-moves-like/dance-poses";
import { prefersReducedMotion } from "@/lib/the-moves-like/performance";

type LimbRefs = {
  root: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  lArm: THREE.Group;
  lFore: THREE.Group;
  rArm: THREE.Group;
  rFore: THREE.Group;
  lThigh: THREE.Group;
  lShin: THREE.Group;
  rThigh: THREE.Group;
  rShin: THREE.Group;
};

function applyPose(refs: LimbRefs, pose: DancePose) {
  refs.root.position.y = pose.hipY;
  refs.root.rotation.x = pose.hipX;
  refs.torso.rotation.set(pose.torsoX, pose.torsoY, pose.torsoZ);
  refs.head.rotation.set(pose.headX, pose.headY, 0);
  refs.lArm.rotation.set(pose.lShoulderX, 0, pose.lShoulderZ);
  refs.lFore.rotation.x = pose.lElbowX;
  refs.rArm.rotation.set(pose.rShoulderX, 0, pose.rShoulderZ);
  refs.rFore.rotation.x = pose.rElbowX;
  refs.lThigh.rotation.x = pose.lHipX;
  refs.lShin.rotation.x = pose.lKneeX;
  refs.rThigh.rotation.x = pose.rHipX;
  refs.rShin.rotation.x = pose.rKneeX;
}

function Limb({
  radius = 0.055,
  length = 0.35,
  color,
}: {
  radius?: number;
  length?: number;
  color: number;
}) {
  return (
    <mesh position={[0, -length / 2, 0]} castShadow>
      <capsuleGeometry args={[radius, Math.max(0.01, length - radius * 2), 4, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.12}
        roughness={0.45}
        metalness={0.15}
      />
    </mesh>
  );
}

export function DancerFigure({
  moveIds,
  audioEnergy = 0,
  playbackProgress,
  mode = "freestyle",
}: {
  moveIds: string[];
  audioEnergy?: number;
  playbackProgress?: number;
  mode?: "freestyle" | "dna" | "rhythm" | "choreo";
}) {
  const root = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const lArm = useRef<THREE.Group>(null);
  const lFore = useRef<THREE.Group>(null);
  const rArm = useRef<THREE.Group>(null);
  const rFore = useRef<THREE.Group>(null);
  const lThigh = useRef<THREE.Group>(null);
  const lShin = useRef<THREE.Group>(null);
  const rThigh = useRef<THREE.Group>(null);
  const rShin = useRef<THREE.Group>(null);

  const moves = useMemo(
    () => moveIds.map((id) => getMove(id)).filter((m): m is NonNullable<typeof m> => Boolean(m)),
    [moveIds],
  );

  const skin = MOVES_LIKE_HEX.primary;
  const accent = MOVES_LIKE_HEX.secondary;

  useFrame((state) => {
    if (
      !root.current ||
      !torso.current ||
      !head.current ||
      !lArm.current ||
      !lFore.current ||
      !rArm.current ||
      !rFore.current ||
      !lThigh.current ||
      !lShin.current ||
      !rThigh.current ||
      !rShin.current
    ) {
      return;
    }

    const refs: LimbRefs = {
      root: root.current,
      torso: torso.current,
      head: head.current,
      lArm: lArm.current,
      lFore: lFore.current,
      rArm: rArm.current,
      rFore: rFore.current,
      lThigh: lThigh.current,
      lShin: lShin.current,
      rThigh: rThigh.current,
      rShin: rShin.current,
    };

    if (prefersReducedMotion()) {
      applyPose(refs, sampleMovePose(moves[0], 0, audioEnergy));
      return;
    }

    const t = state.clock.elapsedTime;
    let pose: DancePose;
    if (mode === "choreo" && moves.length > 1 && typeof playbackProgress === "number") {
      pose = sampleRoutinePose(moves, playbackProgress, t).pose;
    } else {
      pose = sampleMovePose(moves[0], t, 0.35 + audioEnergy);
    }
    applyPose(refs, pose);

    // Gentle body facing so silhouette reads clearly
    root.current.rotation.y = Math.sin(t * 0.35) * 0.15;
  });

  return (
    <group position={[0, -0.15, 0]} scale={1.15}>
      {/* Ground contact shadow disc */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.02, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshStandardMaterial color="#5B8DA8" transparent opacity={0.18} />
      </mesh>

      <group ref={root} position={[0, 0, 0]}>
        {/* Hip / pelvis */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.28, 0.14, 0.16]} />
          <meshStandardMaterial color={accent} roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Torso */}
        <group ref={torso} position={[0, 0.08, 0]}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[0.34, 0.55, 0.18]} />
            <meshStandardMaterial
              color={skin}
              emissive={skin}
              emissiveIntensity={0.18}
              roughness={0.4}
              metalness={0.2}
            />
          </mesh>

          {/* Head */}
          <group ref={head} position={[0, 0.68, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.13, 16, 16]} />
              <meshStandardMaterial color={0xe8f0f4} roughness={0.5} />
            </mesh>
          </group>

          {/* Left arm */}
          <group ref={lArm} position={[0.2, 0.5, 0]}>
            <Limb length={0.32} color={skin} />
            <group ref={lFore} position={[0, -0.32, 0]}>
              <Limb length={0.3} radius={0.045} color={accent} />
            </group>
          </group>

          {/* Right arm */}
          <group ref={rArm} position={[-0.2, 0.5, 0]}>
            <Limb length={0.32} color={skin} />
            <group ref={rFore} position={[0, -0.32, 0]}>
              <Limb length={0.3} radius={0.045} color={accent} />
            </group>
          </group>
        </group>

        {/* Left leg */}
        <group ref={lThigh} position={[0.1, -0.02, 0]}>
          <Limb length={0.4} radius={0.065} color={skin} />
          <group ref={lShin} position={[0, -0.4, 0]}>
            <Limb length={0.38} radius={0.055} color={accent} />
          </group>
        </group>

        {/* Right leg */}
        <group ref={rThigh} position={[-0.1, -0.02, 0]}>
          <Limb length={0.4} radius={0.065} color={skin} />
          <group ref={rShin} position={[0, -0.4, 0]}>
            <Limb length={0.38} radius={0.055} color={accent} />
          </group>
        </group>
      </group>
    </group>
  );
}
