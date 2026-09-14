"use client";

import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Props = {
  lite?: boolean;
};

function fallbackEnvironment(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#6a8a9a";
  ctx.fillRect(0, 0, 4, 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** PMREM required — iridescent Baloon8 materials are invisible without scene.environment. */
export function Baloon8RunEnvironment({ lite = false }: Props) {
  const { scene, gl } = useThree();

  useLayoutEffect(() => {
    const fallback = fallbackEnvironment();
    scene.environment = fallback;

    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();

    let target: THREE.WebGLRenderTarget | null = null;
    try {
      target = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, {
        size: lite ? 128 : 256,
      });
      fallback.dispose();
      scene.environment = target.texture;
    } catch (err) {
      console.warn("[Baloon8RunEnvironment] PMREM failed, using fallback env", err);
    }

    return () => {
      scene.environment = null;
      if (target) target.dispose();
      else fallback.dispose();
      pmrem.dispose();
    };
  }, [scene, gl, lite]);

  return null;
}
