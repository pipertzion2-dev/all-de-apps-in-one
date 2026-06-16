"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getGraphicPalette } from "@/lib/artwork-palettes";
import { buildSeedsInteractiveScene } from "@/lib/seeds-interactive-scene";
import type { SeedsWorkflowState } from "@/lib/seeds-workflow-state";

type Props = {
  state: SeedsWorkflowState;
  accentColor?: string;
  className?: string;
  onPodClick?: (podIndex: number) => void;
};

export function SeedsInteractiveCanvas({
  state,
  accentColor = "#5BA8A0",
  className = "",
  onPodClick,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const onPodClickRef = useRef(onPodClick);

  stateRef.current = state;
  onPodClickRef.current = onPodClick;

  useEffect(() => {
    const el = mountRef.current;
    const shell = shellRef.current;
    if (!el || !shell) return;

    const palette = getGraphicPalette("seeds");
    let w = el.clientWidth || 400;
    let h = el.clientHeight || 360;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.7;
    const canvas = renderer.domElement;
    canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
    el.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, w / h, 0.1, 140);
    camera.position.set(0, 0.25, 10.5);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 5, 8);
    scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color(accentColor).getHex(), 0.7);
    rim.position.set(-4, 1, -3);
    scene.add(rim);
    const accentLight = new THREE.PointLight(new THREE.Color(accentColor).getHex(), 1.8, 48);
    accentLight.position.set(-2, 1.5, 6);
    scene.add(accentLight);

    const interactive = buildSeedsInteractiveScene(palette);
    scene.add(interactive.root);

    const mouse = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const onPointerMove = (e: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointer.x = mouse.x;
      pointer.y = mouse.y;
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = shell.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactive.root.children, true);
      for (const hit of hits) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData.podIndex !== undefined) {
            onPodClickRef.current?.(obj.userData.podIndex as number);
            return;
          }
          obj = obj.parent;
        }
      }
    };

    shell.addEventListener("pointermove", onPointerMove, { passive: true });
    shell.addEventListener("pointerdown", onPointerDown);

    let raf = 0;
    const start = Date.now();
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = (Date.now() - start) / 1000;
      const s = stateRef.current;
      const focus = shell.matches(":hover") ? 1 : 0.55;

      interactive.tick(t, s, mouse, focus);

      const phaseZ =
        s.phase === "building" ? 9.2 : s.phase === "complete" ? 8.8 : s.phase === "uploading" ? 10.2 : 10.5;
      camera.position.x = mouse.x * 0.28 * focus;
      camera.position.y = 0.2 + mouse.y * 0.16 * focus;
      camera.position.z = phaseZ;
      camera.lookAt(mouse.x * 0.08, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      w = el.clientWidth;
      h = el.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      shell.removeEventListener("pointermove", onPointerMove);
      shell.removeEventListener("pointerdown", onPointerDown);
      ro.disconnect();
      renderer.dispose();
      canvas.remove();
    };
  }, [accentColor]);

  const phaseLabel: Record<SeedsWorkflowState["phase"], string> = {
    idle: "Drop a PDF to plant your spec",
    uploading: "Parsing blueprint…",
    parsed: `${state.activePods} seed${state.activePods === 1 ? "" : "s"} branched — verify or build`,
    verifying: "Running invariant proofs…",
    building: `Building ${state.buildingCount} app${state.buildingCount === 1 ? "" : "s"}…`,
    complete: "All seeds built — deploy or market",
  };

  return (
    <div
      ref={shellRef}
      className={`relative overflow-hidden rounded-xl border border-border/40 ${className}`}
      style={{
        background: `radial-gradient(ellipse 90% 70% at 50% 40%, ${accentColor}20 0%, transparent 62%)`,
      }}
      data-seeds-interactive-canvas
      aria-label="Interactive seed cluster — click a pod to jump to that app"
    >
      <div ref={mountRef} className="absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 z-10 px-3 py-2 bg-gradient-to-t from-background/85 via-background/50 to-transparent pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-mono">
          Live cluster
        </p>
        <p className="text-xs text-foreground/90 font-medium">{phaseLabel[state.phase]}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Pods = apps · Click a lit pod to scroll to seeds
        </p>
      </div>
    </div>
  );
}
