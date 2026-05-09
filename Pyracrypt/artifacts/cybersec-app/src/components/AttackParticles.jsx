import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshStandardMaterial, Object3D, SphereGeometry, Vector3 } from "three";

import { cssVarColor } from "../utils/cssVarColor";

const tmp = new Object3D();

export function AttackParticles({ edges, active }) {
  const mesh = useRef();
  const count = 48;
  const danger = useMemo(() => cssVarColor("--danger"), []);
  const warm = useMemo(() => cssVarColor("--accent"), []);
  const geometry = useMemo(() => new SphereGeometry(0.07, 10, 10), []);
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color: danger,
        emissive: warm,
        emissiveIntensity: 0.55,
        metalness: 0.2,
        roughness: 0.35,
        toneMapped: false,
      }),
    [danger, warm],
  );

  const paths = useMemo(() => {
    const list = (edges || []).slice(0, 6);
    if (!list.length) {
      return [{ a: new Vector3(1.2, 0, 0), b: new Vector3(-1.2, 0, 0) }];
    }
    return list.map((e) => ({
      a: new Vector3(...e.from),
      b: new Vector3(...e.to),
    }));
  }, [edges]);

  useLayoutEffect(() => {
    if (!mesh.current) return;
    for (let i = 0; i < count; i++) {
      tmp.position.set(0, 0, 0);
      tmp.scale.setScalar(0.05);
      tmp.updateMatrix();
      mesh.current.setMatrixAt(i, tmp.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (!mesh.current) return;
    material.emissiveIntensity = active ? 0.95 : 0.35;
    for (let i = 0; i < count; i++) {
      const path = paths[i % paths.length];
      const u = (i / count + t * (active ? 0.35 : 0.12)) % 1;
      const p = path.a.clone().lerp(path.b, u);
      const jitter = active ? Math.sin(t * 20 + i) * 0.04 : Math.sin(t * 6 + i) * 0.015;
      tmp.position.set(p.x, p.y + jitter, p.z);
      const s = active ? 0.07 + (i % 5) * 0.006 : 0.045;
      tmp.scale.setScalar(s);
      tmp.updateMatrix();
      mesh.current.setMatrixAt(i, tmp.matrix);
    }
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={mesh} args={[geometry, material, count]} frustumCulled={false} />;
}
