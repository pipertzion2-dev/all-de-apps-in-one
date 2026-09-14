"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = {
  /** PMREM is heavy on mobile GPUs — skip on phones/tablets. */
  enabled?: boolean;
};

/** Same studio PMREM as homepage Baloon8ShoeScene — required for iridescent bubbles. */
export function Baloon8RunEnvironment({ enabled = true }: Props) {
  const { scene, gl } = useThree();

  useEffect(() => {
    if (!enabled) return;
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [scene, gl, enabled]);

  return null;
}
