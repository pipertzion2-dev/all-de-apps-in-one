"use client";

/**
 * FeatureThreeBackground — graphic-faithful 3D motifs, toned to sit behind UI without clashing.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FEATURES, type FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildFeaturePageScene } from "@/lib/feature-page-scenes";

export type FeatureVariant = FeatureId;

type Props = { variant: FeatureVariant };

export function FeatureThreeBackground({ variant }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const feature = FEATURES.find((f) => f.id === variant) ?? FEATURES[0];

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = window.innerWidth;
    const H = window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "0";
    el.appendChild(canvas);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 120);
    camera.position.z = 12;

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 0.5);
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
      camera.position.x = mouse.x * 0.45;
      camera.position.y = mouse.y * 0.28;
      camera.lookAt(mouse.x * 0.2, mouse.y * 0.15, 0);
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

  const accent = feature.accentColor;
  const secondary =
    variant === "seeds" ? "#6B2C4A" : variant === "orbit" ? "#c06010" : undefined;

  return (
    <>
      <div
        ref={mountRef}
        aria-hidden
        data-svivva-feature-bg={variant}
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        style={{
          background: [
            `radial-gradient(ellipse 90% 65% at 25% 30%, ${accent}08 0%, transparent 60%)`,
            secondary ? `radial-gradient(ellipse 70% 55% at 75% 65%, ${secondary}06 0%, transparent 55%)` : "",
          ]
            .filter(Boolean)
            .join(", "),
        }}
      />
      {/* Vignette — keeps Three.js behind readable UI panels */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background) / 0.55) 0%, transparent 22%, transparent 72%, hsl(var(--background) / 0.65) 100%)",
        }}
      />
    </>
  );
}
