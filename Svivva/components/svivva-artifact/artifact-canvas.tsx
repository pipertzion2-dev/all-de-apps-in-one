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

    // Render at 1.6× container so rotating cube corners never reach the buffer edge.
    // The canvas element overflows the container (overflow:visible) safely.
    const cW = el.clientWidth || 520;
    const cH = el.clientHeight || 520;
    const SCALE = 1.6;
    const W = Math.round(cW * SCALE);
    const H = Math.round(cH * SCALE);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    // Centre the oversized canvas; parent overflow:visible lets it spill out
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: W + "px",
      height: H + "px",
      pointerEvents: "auto",
    });
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // FOV=42 + z=5.5: bounding sphere of 2-unit cube (r≈1.73) fits with 20% margin
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    // Very high ambient so textures appear at near-original photo brightness
    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    // Soft fill from below-left for subtle shape definition
    const fillLight = new THREE.DirectionalLight(0xd0e0ff, 0.25);
    fillLight.position.set(-4, -3, 2);
    scene.add(fillLight);
    // Orbiting point light — creates the premium specular "shine"
    const orbitLight = new THREE.PointLight(0xffffff, 2.8, 16);
    orbitLight.position.set(3, 3, 4);
    scene.add(orbitLight);

    // MeshStandardMaterial: emissiveMap = texture so photos are self-illuminating
    // (full original brightness) while metalness keeps the sheen
    const materials: THREE.MeshStandardMaterial[] = FACE_ORDER.map((fId) => {
      const feature = FEATURES.find((f) => f.id === fId)!;
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.18,
        roughness: 0.22,
        transparent: true,
        opacity: 0,
        side: THREE.FrontSide,
      });

      new THREE.TextureLoader().load(
        feature.artworkSrc,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          mat.map = tex;
          // emissiveMap makes the texture self-illuminate — photos appear as bright
          // as the originals regardless of how much light hits the face
          mat.emissiveMap = tex;
          mat.emissive = new THREE.Color(0xffffff);
          mat.emissiveIntensity = 0.55;
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          mat.color.set(new THREE.Color(feature.accentColor));
          mat.opacity = 0.7;
          mat.needsUpdate = true;
        },
      );
      return mat;
    });

    // Slightly thicker box so side bevels are visible when rotating
    const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2, 1, 1, 1), materials);
    scene.add(box);

    // Glowing edges — brighter for 3D definition
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.02, 2.02, 2.02)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }),
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
    const OPACITY_ACTIVE = 0.95; // nearly opaque so graphic is crystal-clear
    const OPACITY_IDLE = 0.78;
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

      // Orbit the point light slowly for dynamic specular pop
      const t = Date.now() * 0.0006;
      orbitLight.position.set(Math.cos(t) * 4, Math.sin(t * 0.7) * 3, Math.sin(t) * 4 + 3);

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

    // Resize — keep 1.6× buffer ratio
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.clientWidth * SCALE);
      const h = Math.round(el.clientHeight * SCALE);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      Object.assign(renderer.domElement.style, { width: w + "px", height: h + "px" });
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

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", overflow: "visible", touchAction: "none" }}
    />
  );
}
