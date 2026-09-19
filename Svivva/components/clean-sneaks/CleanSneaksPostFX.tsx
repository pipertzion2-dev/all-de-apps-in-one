"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";

type Props = {
  mobile?: boolean;
  /** Post-processing often crashes iOS WebGL — disable on mobile tier. */
  enabled?: boolean;
};

/** Bloom + vignette with ACES tone mapping for cinematic runner look. */
export function CleanSneaksPostFX({ mobile = false, enabled = true }: Props) {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = mobile ? 1.05 : 1.18;
    gl.outputColorSpace = THREE.SRGBColorSpace;
  }, [gl, mobile]);

  if (!enabled) return null;

  return (
    <EffectComposer multisampling={mobile ? 0 : 4}>
      <Bloom
        intensity={mobile ? 0.52 : 0.78}
        luminanceThreshold={0.58}
        luminanceSmoothing={0.32}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.22} darkness={mobile ? 0.55 : 0.68} />
    </EffectComposer>
  );
}
