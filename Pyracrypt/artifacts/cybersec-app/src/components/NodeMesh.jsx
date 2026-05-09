import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

import { cssVarColor } from "../utils/cssVarColor";

export function NodeMesh({ position, label, activity, attackShake, phase }) {
  const group = useRef();
  const mesh = useRef();
  const primary = useMemo(() => cssVarColor("--primary"), []);
  const danger = useMemo(() => cssVarColor("--danger"), []);
  const success = useMemo(() => cssVarColor("--success"), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!group.current || !mesh.current) return;
    mesh.current.rotation.y += 0.01;
    const basePulse = activity ? 1 + Math.sin(t * 6) * 0.08 : 1 + Math.sin(t * 1.8) * 0.03;
    const shake = attackShake ? Math.sin(t * 48) * 0.05 : 0;
    mesh.current.scale.setScalar(basePulse);
    group.current.position.set(position[0] + shake, position[1] + shake * 0.7, position[2]);
  });

  const color = phase === "REMEDY" ? success : phase === "ATTACK" ? danger : primary;

  return (
    <group ref={group} position={position}>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.32, 32, 32]} />
        <meshStandardMaterial
          color={color}
          metalness={1}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={0.18}
        />
      </mesh>
      <Text
        font="/fonts/DecimaMonoPro-Regular.ttf"
        position={[0, 0.55, 0]}
        fontSize={0.14}
        color={color}
        anchorX="center"
        anchorY="bottom"
        maxWidth={2.2}
      >
        {label}
      </Text>
    </group>
  );
}
