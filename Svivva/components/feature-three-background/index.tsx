"use client";

/**
 * FeatureThreeBackground — graphic-faithful 3D motifs behind feature pages.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FEATURES, type FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildFeaturePageScene } from "@/lib/feature-page-scenes";

export type FeatureVariant = FeatureId;

type Props = {
  variant: FeatureVariant;
  /** Brighter lines + fixed viewport layer (default on feature routes). */
  dramatic?: boolean;
};

export function FeatureThreeBackground({ variant, dramatic = true }: Props) {
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
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, W / H, 0.1, 180);
    camera.position.set(0, 0.4, dramatic ? 6.5 : 10);

    scene.add(new THREE.AmbientLight(0xffffff, dramatic ? 0.85 : 0.45));
    const key = new THREE.DirectionalLight(0xffffff, dramatic ? 0.9 : 0.5);
    key.position.set(4, 6, 8);
    scene.add(key);
    const accentLight = new THREE.PointLight(
      new THREE.Color(feature.accentColor).getHex(),
      dramatic ? 1.4 : 0.6,
      40,
    );
    accentLight.position.set(-3, 2, 6);
    scene.add(accentLight);

    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    let tick: (t: number, scroll?: number) => void = () => {};
    let cancelled = false;
    const sceneRoot = new THREE.Group();
    if (dramatic) sceneRoot.scale.setScalar(variant === "seeds" ? 1.35 : 1.15);
    scene.add(sceneRoot);

    buildFeaturePageScene(variant, sceneRoot, mouse)
      .then((fn) => {
        if (!cancelled) tick = fn;
      })
      .catch((err) => {
        console.warn("[FeatureThreeBackground] scene build failed:", err);
      });

    const scrollRef = { current: 0 };
    const scrollNorm = () => {
      const main = document.querySelector<HTMLElement>("main.overflow-y-auto");
      if (main && main.scrollHeight > main.clientHeight + 40) {
        const max = main.scrollHeight - main.clientHeight;
        return max > 0 ? Math.min(1, main.scrollTop / max) : 0;
      }
      const max = document.body.scrollHeight - window.innerHeight;
      return max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };
    const onScroll = () => {
      scrollRef.current = scrollNorm();
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
      sceneRoot.rotation.y = scroll * Math.PI * 0.85 + Math.sin(t * 0.14) * 0.06;
      sceneRoot.rotation.x = -0.08 + scroll * 0.28;
      const fly = dramatic ? 7 : 5.5;
      camera.position.z = (dramatic ? 6.5 : 10) - scroll * fly;
      camera.position.y = 0.4 + scroll * 1.6 + mouse.y * 0.28;
      camera.position.x = mouse.x * 0.65 + Math.sin(t * 0.2 + scroll * 2.2) * 0.45;
      camera.lookAt(mouse.x * 0.2, scroll * 0.45 + mouse.y * 0.12, -5);
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
  }, [variant, dramatic, feature.accentColor]);

  const accent = feature.accentColor;
  const secondary =
    variant === "seeds" ? "#6B2C4A" : variant === "orbit" ? "#c06010" : undefined;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
      data-svivva-feature-bg={variant}
    >
      <div
        ref={mountRef}
        className="absolute inset-0"
        style={{
          background: [
            `radial-gradient(ellipse 100% 80% at 30% 25%, ${accent}18 0%, transparent 55%)`,
            secondary ? `radial-gradient(ellipse 80% 70% at 70% 60%, ${secondary}14 0%, transparent 50%)` : "",
            `radial-gradient(ellipse 60% 50% at 50% 50%, ${accent}08 0%, transparent 70%)`,
          ]
            .filter(Boolean)
            .join(", "),
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--background) / 0.05) 0%, transparent 25%, transparent 72%, hsl(var(--background) / 0.18) 100%)",
        }}
      />
    </div>
  );
}
