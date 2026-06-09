"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FeatureId } from "./feature-defs";
import { FEATURES } from "./feature-defs";

type Props = {
  active: FeatureId;
  onSelect: (id: FeatureId) => void;
};

// BoxGeometry face order: +x, -x, +y, -y, +z, -z
const FACE_ORDER: FeatureId[] = ["api", "security", "play", "hardware", "seeds", "orbit"];

export function ArtifactCanvas({ active, onSelect }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<FeatureId>(active);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 460;
    const H = el.clientHeight || 460;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.4);

    // Use MeshBasicMaterial — no lighting dimming, artwork shows at full photo brightness
    const materials: THREE.MeshBasicMaterial[] = FACE_ORDER.map((fId) => {
      const feature = FEATURES.find((f) => f.id === fId)!;
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
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
          // fallback: accent-coloured face
          mat.color.set(new THREE.Color(feature.accentColor));
          mat.opacity = 0.7;
          mat.needsUpdate = true;
        },
      );
      return mat;
    });

    // Box mesh
    const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), materials);
    scene.add(box);

    // Glowing edges
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.02, 2.02, 2.02)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 }),
    );
    scene.add(edges);

    // ── interaction ───────────────────────────────────────────────────────────
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotY = 0.55;
    let targetRotX = -0.28;
    let pointerMoved = false;

    const cv = renderer.domElement;
    cv.style.cursor = "grab";

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      pointerMoved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = velY = 0;
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pointerMoved = true;
      velX = dx * 0.015;
      velY = dy * 0.015;
      targetRotY += dx * 0.009;
      targetRotX += dy * 0.009;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      isDragging = false;
      cv.style.cursor = "grab";
      if (pointerMoved) return;
      const rect = cv.getBoundingClientRect();
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

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);

    // ── animation ─────────────────────────────────────────────────────────────
    const OPACITY_ACTIVE = 0.82; // bright + glassy
    const OPACITY_IDLE = 0.62;
    let fadeT = 0;
    const FADE_FRAMES = 55;

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Fade in
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
          targetRotY += 0.004;
        }
      }

      box.rotation.y += (targetRotY - box.rotation.y) * 0.085;
      box.rotation.x += (targetRotX - box.rotation.x) * 0.085;
      edges.rotation.copy(box.rotation);

      // Active face highlight
      if (fadeT >= FADE_FRAMES) {
        const activeIdx = FACE_ORDER.indexOf(activeRef.current);
        materials.forEach((m, i) => {
          const target = i === activeIdx ? OPACITY_ACTIVE : OPACITY_IDLE;
          m.opacity += (target - m.opacity) * 0.08;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" style={{ touchAction: "none" }} />;
}
