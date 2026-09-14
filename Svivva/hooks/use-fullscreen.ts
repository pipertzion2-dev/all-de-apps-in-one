"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

async function requestElementFullscreen(el: FullscreenElement): Promise<boolean> {
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return true;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return true;
    }
  } catch {
    /* Native fullscreen blocked — CSS overlay still covers the viewport */
  }
  return false;
}

async function exitNativeFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
    }
  } catch {
    /* ignore */
  }
}

export type UseFullscreenOptions = {
  /** When false, only toggles the immersive CSS overlay (no Fullscreen API). */
  native?: boolean;
  /** Fired when the user exits native fullscreen (Esc / back), not on CSS-only mode. */
  onNativeExit?: () => void;
};

export function useFullscreen(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFullscreenOptions = {},
) {
  const { native = false, onNativeExit } = options;
  const [active, setActive] = useState(false);
  const onNativeExitRef = useRef(onNativeExit);
  const exitingRef = useRef(false);
  const enteredNativeRef = useRef(false);
  onNativeExitRef.current = onNativeExit;

  const enter = useCallback(async () => {
    setActive(true);
    if (!native) return;

    const el = containerRef.current;
    if (!el) return;
    enteredNativeRef.current = await requestElementFullscreen(el);
  }, [containerRef, native]);

  const exit = useCallback(async () => {
    exitingRef.current = true;
    if (native && enteredNativeRef.current) {
      await exitNativeFullscreen();
      enteredNativeRef.current = false;
    }
    setActive(false);
    exitingRef.current = false;
  }, [native]);

  useEffect(() => {
    if (!native) return;

    const onChange = () => {
      const nativeActive = !!getFullscreenElement();
      if (nativeActive) {
        enteredNativeRef.current = true;
        return;
      }
      if (enteredNativeRef.current && !exitingRef.current) {
        enteredNativeRef.current = false;
        setActive(false);
        onNativeExitRef.current?.();
      }
    };

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [native]);

  useEffect(() => {
    if (!active) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [active]);

  return { active, enter, exit };
}
