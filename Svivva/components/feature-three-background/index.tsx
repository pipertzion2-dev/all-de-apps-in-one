"use client";

/**
 * FeatureThreeBackground — graphic-faithful 3D motifs behind feature pages.
 */

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { FEATURES, type FeatureId } from "@/components/svivva-artifact/feature-defs";
import { buildFeaturePageScene } from "@/lib/feature-page-scenes";
import { pageScrollProgress } from "@/lib/feature-scroll-progress";

export type FeatureVariant = FeatureId;

type Props = {
  variant: FeatureVariant;
  dramatic?: boolean;
  scope?: "page" | "fixed";
};

function measureCanvas(scope: "page" | "fixed", el: HTMLElement) {
  const pageShell = el.closest("[data-feature-page]") as HTMLElement | null;
  // Viewport-sized layer only — never stretch canvas to document height (causes trailing black void).
  return {
    w: window.innerWidth,
    h: window.innerHeight,
    pageShell: scope === "page" ? pageShell : null,
  };
}

export function FeatureThreeBackground({ variant, dramatic = true, scope = "page" }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const feature = FEATURES.find((f) => f.id === variant) ?? FEATURES[0];

  useEffect(() => {
    const el = mountRef.current;
    const shell = shellRef.current;
    if (!el || !shell) return;

    let { w, h, pageShell } = measureCanvas(scope, shell);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = dramatic ? 1.38 : 1.12;
    const canvas = renderer.domElement;
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.style.pointerEvents = "none";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, w / h, 0.1, 180);
    camera.position.set(0, 0.4, dramatic ? 6.5 : 10);

    scene.add(new THREE.AmbientLight(0xffffff, dramatic ? 0.75 : 0.45));
    const key = new THREE.DirectionalLight(0xffffff, dramatic ? 1.0 : 0.55);
    key.position.set(4, 6, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color(feature.accentColor).getHex(), dramatic ? 0.55 : 0.3);
    rim.position.set(-5, 2, -4);
    scene.add(rim);
    const accentLight = new THREE.PointLight(
      new THREE.Color(feature.accentColor).getHex(),
      dramatic ? 1.6 : 0.65,
      48,
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
    if (dramatic) sceneRoot.scale.setScalar(1.05);
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
      scrollRef.current = pageScrollProgress();
    };
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    onScroll();

    const resize = () => {
      const m = measureCanvas(scope, shell);
      w = m.w;
      h = m.h;
      pageShell = m.pageShell;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let rafId = 0;
    const start = Date.now();
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const t = (Date.now() - start) / 1000;
      const scroll = scrollRef.current;
      tick(t, scroll);
      sceneRoot.rotation.y = scroll * Math.PI * 0.2 + Math.sin(t * 0.14) * 0.03;
      sceneRoot.rotation.x = -0.04 + scroll * 0.08;
      const fly = dramatic ? 1.4 : 1;
      const baseZ = dramatic ? 7.5 : 10;
      camera.position.z = Math.max(baseZ - 0.8, baseZ - scroll * fly);
      camera.position.y = 0.25 + scroll * 0.15 + mouse.y * 0.12;
      camera.position.x = mouse.x * 0.22 + Math.sin(t * 0.2 + scroll * 0.8) * 0.1;
      camera.lookAt(mouse.x * 0.08, scroll * 0.1 + mouse.y * 0.05, -6);
      renderer.render(scene, camera);
    };
    animate();

    resize();
    window.addEventListener("resize", resize, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      canvas.remove();
    };
  }, [variant, dramatic, feature.accentColor, scope]);

  const accent = feature.accentColor;
  const secondary =
    variant === "seeds" ? "#6B2C4A" : variant === "orbit" ? "#c06010" : undefined;

  const positionClass = "fixed inset-0";

  return (
    <div
      ref={shellRef}
      className={`pointer-events-none z-0 overflow-hidden bg-transparent ${positionClass}`}
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
    </div>
  );
}
