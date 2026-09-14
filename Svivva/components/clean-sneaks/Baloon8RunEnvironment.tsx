"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = {
  /** Lower-resolution PMREM on phones — still required for visible iridescent materials. */
  lite?: boolean;
};

/** Studio PMREM — Baloon8 physical/iridescent materials are invisible without scene.environment. */
export function Baloon8RunEnvironment({ lite = false }: Props) {
  const { scene, gl } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    const target = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, {
      size: lite ? 128 : 256,
    });
    scene.environment = target.texture;

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
    };
  }, [scene, gl, lite]);

  return null;
}
