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
  onExit?: () => void;
};

export function useFullscreen(
  containerRef: RefObject<HTMLElement | null>,
  options: UseFullscreenOptions = {},
) {
  const { native = true, onExit } = options;
  const [active, setActive] = useState(false);
  const onExitRef = useRef(onExit);
  const exitingRef = useRef(false);
  onExitRef.current = onExit;

  const enter = useCallback(async () => {
    setActive(true);
    if (native) {
      const el = containerRef.current;
      if (el) await requestElementFullscreen(el);
    }
  }, [containerRef, native]);

  const exit = useCallback(async () => {
    exitingRef.current = true;
    if (native) await exitNativeFullscreen();
    setActive(false);
    exitingRef.current = false;
  }, [native]);

  useEffect(() => {
    const onChange = () => {
      const nativeActive = !!getFullscreenElement();
      if (!nativeActive && active && !exitingRef.current) {
        setActive(false);
        onExitRef.current?.();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, [active]);

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
