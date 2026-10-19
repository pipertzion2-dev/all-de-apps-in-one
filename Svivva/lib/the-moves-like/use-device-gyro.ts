"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  gyroMotionEnergy,
  isGyroSupported,
  mergeMotionEvent,
  needsGyroUserGesture,
  publishGyroSample,
  requestGyroPermission,
  sampleFromOrientationEvent,
  type GyroPermissionState,
  type GyroSample,
} from "./device-gyro";

export type UseDeviceGyroResult = {
  sample: GyroSample | null;
  energy: number;
  status: GyroPermissionState;
  supported: boolean;
  /** Call from a tap/click — required on iPhone before sensors flow. */
  ensurePermission: () => Promise<boolean>;
  stop: () => void;
};

/**
 * Start device orientation/gyro automatically when the platform allows it.
 * On iPhone, call `ensurePermission()` from the first user gesture (Practice button, etc.).
 */
export function useDeviceGyro(opts?: {
  enabled?: boolean;
  /** Try to start on mount without a gesture (works on Android / already-granted iOS). */
  autoStart?: boolean;
}): UseDeviceGyroResult {
  const enabled = opts?.enabled !== false;
  const autoStart = opts?.autoStart !== false;
  const [sample, setSample] = useState<GyroSample | null>(null);
  const [status, setStatus] = useState<GyroPermissionState>(() =>
    typeof window === "undefined" ? "unsupported" : isGyroSupported() ? "prompt" : "unsupported",
  );
  const sampleRef = useRef<GyroSample | null>(null);
  const listeningRef = useRef(false);

  const onOrient = useCallback((e: DeviceOrientationEvent) => {
    const next = sampleFromOrientationEvent(e);
    const merged: GyroSample = {
      ...next,
      acceleration: sampleRef.current?.acceleration ?? null,
      rotationRate: sampleRef.current?.rotationRate ?? null,
    };
    sampleRef.current = merged;
    publishGyroSample(merged);
    setSample(merged);
  }, []);

  const onMotion = useCallback((e: DeviceMotionEvent) => {
    const merged = mergeMotionEvent(sampleRef.current, e);
    sampleRef.current = merged;
    publishGyroSample(merged);
    setSample(merged);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined") return;
    listeningRef.current = false;
    window.removeEventListener("deviceorientation", onOrient as EventListener);
    window.removeEventListener("devicemotion", onMotion as EventListener);
    publishGyroSample(null);
    sampleRef.current = null;
    setSample(null);
  }, [onOrient, onMotion]);

  const startListening = useCallback(() => {
    if (listeningRef.current || typeof window === "undefined") return;
    listeningRef.current = true;
    window.addEventListener("deviceorientation", onOrient as EventListener, { passive: true });
    window.addEventListener("devicemotion", onMotion as EventListener, { passive: true });
    setStatus("listening");
  }, [onOrient, onMotion]);

  const ensurePermission = useCallback(async () => {
    if (!enabled) return false;
    if (!isGyroSupported()) {
      setStatus("unsupported");
      return false;
    }
    if (listeningRef.current) return true;

    if (needsGyroUserGesture()) {
      const result = await requestGyroPermission();
      if (result === "denied") {
        setStatus("denied");
        return false;
      }
      if (result === "unavailable") {
        setStatus("unavailable");
        return false;
      }
    }

    setStatus("granted");
    startListening();
    return true;
  }, [enabled, startListening]);

  useEffect(() => {
    if (!enabled || !autoStart || typeof window === "undefined") return;
    if (!isGyroSupported()) {
      setStatus("unsupported");
      return;
    }

    let cancelled = false;

    const tryAuto = async () => {
      if (!needsGyroUserGesture()) {
        if (!cancelled) startListening();
        return;
      }
      // iOS: silent try — succeeds only if already granted for this origin.
      try {
        const result = await requestGyroPermission();
        if (cancelled) return;
        if (result === "granted") {
          setStatus("granted");
          startListening();
        } else {
          setStatus("prompt");
        }
      } catch {
        if (!cancelled) setStatus("prompt");
      }
    };

    void tryAuto();

    const onFirstGesture = () => {
      void ensurePermission();
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true, passive: true });
    window.addEventListener("touchstart", onFirstGesture, { once: true, passive: true });

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("touchstart", onFirstGesture);
      stop();
    };
  }, [enabled, autoStart, ensurePermission, startListening, stop]);

  const energy = gyroMotionEnergy(sample);

  return {
    sample,
    energy,
    status,
    supported: isGyroSupported(),
    ensurePermission,
    stop,
  };
}
