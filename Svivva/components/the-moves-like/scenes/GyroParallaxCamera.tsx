"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { gyroToCameraOffset, readGyroSample } from "@/lib/the-moves-like/device-gyro";
import { prefersReducedMotion } from "@/lib/the-moves-like/performance";

const BASE = { x: 0, y: 0.55, z: 3.6 };
const LOOK = { x: 0, y: 0.1, z: 0 };

/**
 * Gently steers the stage camera from iPhone / Android device orientation.
 * Reads the shared gyro bus (updated by useDeviceGyro) so R3F stays smooth.
 */
export function GyroParallaxCamera({ enabled = true }: { enabled?: boolean }) {
  const { camera } = useThree();
  const smooth = useRef({ x: 0, y: 0 });
  const reduced = useRef(false);

  useFrame((_, delta) => {
    if (!enabled) return;
    if (reduced.current) return;
    if (prefersReducedMotion()) {
      reduced.current = true;
      return;
    }

    const offset = gyroToCameraOffset(readGyroSample());
    const lerp = Math.min(1, delta * 5.5);
    smooth.current.x += (offset.x - smooth.current.x) * lerp;
    smooth.current.y += (offset.y - smooth.current.y) * lerp;

    camera.position.x = BASE.x + smooth.current.y * 1.15;
    camera.position.y = BASE.y + smooth.current.x * 0.55;
    camera.position.z = BASE.z;
    camera.lookAt(LOOK.x, LOOK.y, LOOK.z);
  });

  return null;
}
