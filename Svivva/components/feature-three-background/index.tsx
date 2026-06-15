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

    const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 160);
    camera.position.set(0, 0.8, 10);

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

    let tick: (t: number, scroll?: number) => void = () => {};
    let cancelled = false;
    const sceneRoot = new THREE.Group();
    scene.add(sceneRoot);

    buildFeaturePageScene(variant, sceneRoot, mouse)
      .then((fn) => {
        if (!cancelled) tick = fn;
      })
      .catch((err) => {
        console.warn("[FeatureThreeBackground] scene build failed:", err);
      });

    const scrollRef = { current: 0 };
    const onScroll = () => {
      scrollRef.current = scrollNorm();
    };
    const scrollNorm = () => {
      const main = document.querySelector<HTMLElement>("main.overflow-y-auto");
      if (main && main.scrollHeight > main.clientHeight + 40) {
        const max = main.scrollHeight - main.clientHeight;
        return max > 0 ? Math.min(1, main.scrollTop / max) : 0;
      }
      const max = document.body.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    onScroll();

    let rafId = 0;
    const start = Date.now();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = (Date.now() - start) / 1000;
      const scroll = scrollRef.current;
      tick(t, scroll);
      sceneRoot.rotation.y = scroll * Math.PI * 0.65 + Math.sin(t * 0.12) * 0.04;
      sceneRoot.rotation.x = -0.1 + scroll * 0.22;
      camera.position.z = 10 - scroll * 5.5;
      camera.position.y = 0.8 + scroll * 1.2 + mouse.y * 0.22;
      camera.position.x = mouse.x * 0.5 + Math.sin(t * 0.18 + scroll * 2) * 0.3;
      camera.lookAt(mouse.x * 0.15, scroll * 0.35 + mouse.y * 0.1, -6);
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
      window.removeEventListener("scroll", onScroll, { capture: true });
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
            "linear-gradient(to bottom, hsl(var(--background) / 0.28) 0%, transparent 18%, transparent 75%, hsl(var(--background) / 0.55) 100%)",
        }}
      />
    </>
  );
}
