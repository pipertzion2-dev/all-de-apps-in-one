"use client";

/**
 * FeatureThreeBackground — scroll-reactive Three.js motifs from each cube-face graphic.
 * Portaled to document.body so parent bg-background never hides the WebGL canvas.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { FEATURES, type FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildFeaturePageScene } from "@/lib/feature-page-scenes";

export type FeatureVariant = FeatureId;

type Props = { variant: FeatureVariant };

function ambientGradient(accent: string, secondary?: string): string {
  const sec = secondary ?? accent;
  return [
    `radial-gradient(ellipse 120% 80% at 15% 20%, ${accent}32 0%, transparent 55%)`,
    `radial-gradient(ellipse 100% 70% at 85% 75%, ${sec}20 0%, transparent 50%)`,
    "hsl(var(--background) / 0.55)",
  ].join(", ");
}

export function FeatureThreeBackground({ variant }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const feature = FEATURES.find((f) => f.id === variant) ?? FEATURES[0];
  const secondary =
    variant === "seeds" ? "#6B2C4A" : variant === "orbit" ? "#5BA8A0" : undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = "absolute inset-0 w-full h-full";
    canvas.style.zIndex = "0";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0a0a0c, 0.022);

    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 120);
    camera.position.z = 9;

    scene.add(new THREE.AmbientLight(0xffffff, 0.65));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(4, 6, 8);
    scene.add(key);

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let tick: (t: number) => void = () => {};
    let cancelled = false;
    buildFeaturePageScene(variant, scene, mouse)
      .then((fn) => {
        if (!cancelled) tick = fn;
      })
      .catch((err) => {
        console.warn("[FeatureThreeBackground] scene build failed:", err);
      });

    let rafId = 0;
    const start = Date.now();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      tick((Date.now() - start) / 1000);
      camera.position.x = mouse.x * 0.55;
      camera.position.y = mouse.y * 0.35;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      canvas.remove();
    };
  }, [variant]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={mountRef}
      aria-hidden
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0, background: ambientGradient(feature.accentColor, secondary) }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background:
            "linear-gradient(to bottom, hsl(var(--background) / 0.25) 0%, transparent 16%, transparent 84%, hsl(var(--background) / 0.35) 100%)",
        }}
      />
    </div>,
    document.body,
  );
}
