import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { cssVarColor } from "../utils/cssVarColor";

export function CoreSystem({ phase, processing }) {
  const ref = useRef();
  const accent = useMemo(() => cssVarColor("--accent"), []);
  const secondary = useMemo(() => cssVarColor("--secondary"), []);
  const success = useMemo(() => cssVarColor("--success"), []);
  const danger = useMemo(() => cssVarColor("--danger"), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!ref.current) return;
    ref.current.rotation.y += 0.01;
    ref.current.rotation.x += 0.004;
    const pulse = processing ? 1.15 + Math.sin(t * 4) * 0.12 : 1 + Math.sin(t * 2) * 0.05;
    const expand =
      phase === "DISCOVERY" ? 1.08 : phase === "ATTACK" ? 1.12 : phase === "REMEDY" ? 1.05 : 1;
    ref.current.scale.setScalar(pulse * expand);
  });

  const color = useMemo(() => {
    if (phase === "REMEDY") return success;
    if (phase === "ATTACK") return danger;
    return accent;
  }, [accent, danger, phase, success]);

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.55, 2]} />
      <meshStandardMaterial
        color={color}
        emissive={secondary}
        emissiveIntensity={phase === "DISCOVERY" ? 0.55 : 0.25}
        metalness={1}
        roughness={0.25}
        transparent
        opacity={0.92}
      />
    </mesh>
  );
}
