"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type FrontCameraState = {
  stream: MediaStream | null;
  error: string | null;
  starting: boolean;
  active: boolean;
  start: () => Promise<MediaStream | null>;
  stop: () => void;
};

/** Front-facing (selfie) camera — primary path for phones. */
export function useFrontCamera(opts?: {
  audio?: boolean;
  /** Attach stream to this video when set */
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  autoStart?: boolean;
}): FrontCameraState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
    if (opts?.videoRef?.current) {
      opts.videoRef.current.srcObject = null;
    }
  }, [opts?.videoRef]);

  const start = useCallback(async () => {
    setError(null);
    setStarting(true);
    try {
      // Prefer true front camera on phones; fall back gracefully
      const constraints: MediaStreamConstraints = {
        audio: opts?.audio ?? false,
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1080 },
          height: { ideal: 1920 },
          aspectRatio: { ideal: 9 / 16 },
        },
      };
      let s: MediaStream;
      try {
        s = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        s = await navigator.mediaDevices.getUserMedia({
          audio: opts?.audio ?? false,
          video: { facingMode: "user" },
        });
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = s;
      setStream(s);
      const el = opts?.videoRef?.current;
      if (el) {
        el.srcObject = s;
        el.muted = true;
        el.setAttribute("playsinline", "true");
        el.setAttribute("webkit-playsinline", "true");
        await el.play().catch(() => undefined);
      }
      setStarting(false);
      return s;
    } catch {
      setStarting(false);
      setError(
        "Front camera blocked or unavailable. Allow camera access in Safari/Chrome settings, then try again.",
      );
      return null;
    }
  }, [opts?.audio, opts?.videoRef]);

  useEffect(() => {
    if (!opts?.autoStart) return;
    void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only autoStart
  }, [opts?.autoStart]);

  useEffect(() => () => stop(), [stop]);

  return {
    stream,
    error,
    starting,
    active: Boolean(stream),
    start,
    stop,
  };
}

export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function preferMobileCameraUi(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}
