"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FeatureId } from "./feature-defs";
import { FEATURES } from "./feature-defs";

type Props = {
  active: FeatureId;
  onSelect: (id: FeatureId) => void;
};

// BoxGeometry face order: +x, -x, +y, -y, +z, -z  →  map to features
const FACE_ORDER: FeatureId[] = ["api", "security", "play", "hardware", "seeds", "orbit"];

export function ArtifactCanvas({ active, onSelect }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<FeatureId>(active);
  const onSelectRef = useRef(onSelect);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Keep refs current without re-mounting the scene
  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // ── renderer ──────────────────────────────────────────────────────────────
    const W = el.clientWidth || 420;
    const H = el.clientHeight || 420;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.6);

    // ── lighting ──────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 5, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xaabbff, 0.35);
    fill.position.set(-4, -3, -3);
    scene.add(fill);

    // ── 6 face materials ──────────────────────────────────────────────────────
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const materials: THREE.MeshStandardMaterial[] = FACE_ORDER.map((fId) => {
      const feature = FEATURES.find((f) => f.id === fId)!;
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.08,
        roughness: 0.5,
        transparent: true,
        opacity: 0,
        side: THREE.FrontSide,
      });

      new THREE.TextureLoader().load(
        feature.artworkSrc,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          mat.map = tex;
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          // fallback: tinted solid face so it's always visible
          mat.color.set(new THREE.Color(feature.accentColor));
          mat.opacity = 0.6;
          mat.needsUpdate = true;
        },
      );
      return mat;
    });

    // ── box ───────────────────────────────────────────────────────────────────
    const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materials);
    scene.add(box);

    // ── edge glow ─────────────────────────────────────────────────────────────
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.01, 2.01, 2.01)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 }),
    );
    scene.add(edges);

    // ── drag state ────────────────────────────────────────────────────────────
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotY = 0.5;
    let targetRotX = -0.25;
    let pointerMoved = false;

    const canvas = renderer.domElement;
    canvas.style.cursor = "grab";

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      pointerMoved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = velY = 0;
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pointerMoved = true;
      velX = dx * 0.014;
      velY = dy * 0.014;
      targetRotY += dx * 0.009;
      targetRotX += dy * 0.009;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      isDragging = false;
      canvas.style.cursor = "grab";
      if (pointerMoved) return;
      // tap / click — detect which face is closest to screen center
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObject(box);
      if (hits.length > 0) {
        const fi = hits[0].face?.materialIndex;
        if (fi != null && fi >= 0 && fi < FACE_ORDER.length) {
          onSelectRef.current(FACE_ORDER[fi]);
        }
      }
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);

    // ── animation ─────────────────────────────────────────────────────────────
    const OPACITY_ACTIVE = 0.78;
    const OPACITY_IDLE = 0.52;
    let fadeT = 0;
    const FADE_FRAMES = 50;

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Fade-in from zero
      if (fadeT < FADE_FRAMES) {
        fadeT++;
        const prog = fadeT / FADE_FRAMES;
        materials.forEach((m) => {
          m.opacity = prog * OPACITY_IDLE;
        });
      }

      // Momentum + auto-spin
      if (!isDragging) {
        velX *= 0.9;
        velY *= 0.9;
        targetRotY += velX;
        targetRotX += velY;
        if (Math.abs(velX) < 0.0015 && Math.abs(velY) < 0.0015) {
          targetRotY += 0.004; // gentle auto-rotate
        }
      }

      box.rotation.y += (targetRotY - box.rotation.y) * 0.085;
      box.rotation.x += (targetRotX - box.rotation.x) * 0.085;
      edges.rotation.copy(box.rotation);

      // Active face highlight — lerp opacity
      const cur = activeRef.current;
      const activeIdx = FACE_ORDER.indexOf(cur);
      materials.forEach((m, i) => {
        const target =
          fadeT >= FADE_FRAMES ? (i === activeIdx ? OPACITY_ACTIVE : OPACITY_IDLE) : m.opacity;
        m.opacity += (target - m.opacity) * 0.08;
      });

      renderer.render(scene, camera);
    };
    animate();

    // ── resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    // ── cleanup ───────────────────────────────────────────────────────────────
    const cleanup = () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
    cleanupRef.current = cleanup;
    return cleanup;
  }, []); // mount once — active/onSelect handled via refs

  return <div ref={mountRef} className="w-full h-full" style={{ touchAction: "none" }} />;
}
