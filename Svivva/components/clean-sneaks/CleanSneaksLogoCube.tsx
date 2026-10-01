"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STIEHL_LOGO_CUBE_URL } from "@/lib/clean-sneaks/assets";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";

type Props = {
  className?: string;
  /** Bust query so cache refreshes when the asset changes. */
  cacheBust?: string;
  /** Fired on tap/click when the user did not drag the cube. */
  onActivate?: () => void;
};

/**
 * Six-sided transparent logo cube — the Klean Sneaks homepage entry brand.
 * Drag to spin (with momentum); idle auto-spin continues like the ZZAI artifact cube.
 */
export function CleanSneaksLogoCube({ className = "", cacheBust = "v1", onActivate }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const dragThreshold = mobile ? 10 : 2;
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
    camera.position.set(0, 0.15, 4.35);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      pointerEvents: "auto",
      cursor: "grab",
      touchAction: mobile ? "pan-y" : "none",
    });
    renderer.domElement.setAttribute("aria-hidden", "true");

    scene.add(new THREE.AmbientLight(0xffffff, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 0.85);
    key.position.set(2.2, 2.8, 3.6);
    scene.add(key);

    const cubeSize = 1.72;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const placeholder = new THREE.MeshBasicMaterial({
      color: 0x4a2f5c,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const materials: THREE.MeshBasicMaterial[] = Array.from({ length: 6 }, () =>
      placeholder.clone(),
    );
    const cube = new THREE.Mesh(cubeGeo, materials);
    const group = new THREE.Group();
    group.add(cube);

    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(cubeSize * 1.002, cubeSize * 1.002, cubeSize * 1.002),
      ),
      new THREE.LineBasicMaterial({
        color: 0xe8d9a8,
        transparent: true,
        opacity: 0.28,
      }),
    );
    group.add(wire);
    scene.add(group);

    const disposables: Array<{ dispose: () => void }> = [
      cubeGeo,
      placeholder,
      ...materials,
      wire.geometry,
      wire.material as THREE.Material,
    ];

    let disposed = false;
    let raf = 0;
    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    loader
      .loadAsync(`${STIEHL_LOGO_CUBE_URL}?${cacheBust}`)
      .then((tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAniso;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.needsUpdate = true;
        disposables.push(tex);

        const faceMats = materials.map(() => {
          const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
            side: THREE.FrontSide,
          });
          disposables.push(mat);
          return mat;
        });
        materials.forEach((m) => m.dispose());
        cube.material = faceMats;
      })
      .catch(() => {
        /* keep muted purple placeholders */
      });

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (w < 1 || h < 1) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    // Drag + momentum (same feel as the homepage artifact cube)
    let isDragging = false;
    let dragCommitted = false;
    let pointerMoved = false;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotY = 0.45;
    let targetRotX = -0.22;
    const autoSpin = reduced ? 0.0012 : 0.004;
    const bobAmp = reduced ? 0.02 : 0.08;
    const cv = renderer.domElement;

    const onDown = (e: PointerEvent) => {
      dragCommitted = false;
      isDragging = false;
      pointerMoved = false;
      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = velY = 0;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragCommitted) {
        const totalDx = e.clientX - pointerStartX;
        const totalDy = e.clientY - pointerStartY;
        if (Math.abs(totalDx) < dragThreshold && Math.abs(totalDy) < dragThreshold) return;
        if (mobile && Math.abs(totalDy) >= Math.abs(totalDx)) return;
        dragCommitted = true;
        isDragging = true;
        cv.setPointerCapture(e.pointerId);
        cv.style.cursor = "grabbing";
      }
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold) pointerMoved = true;
      velX = dx * 0.015;
      velY = dy * 0.015;
      targetRotY += dx * 0.009;
      targetRotX += dy * 0.009;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      isDragging = false;
      dragCommitted = false;
      cv.style.cursor = "grab";
      if (cv.hasPointerCapture(e.pointerId)) {
        cv.releasePointerCapture(e.pointerId);
      }
      if (!pointerMoved) {
        onActivateRef.current?.();
      }
    };

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);

    const t0 = performance.now();
    const tick = (now: number) => {
      if (disposed) return;
      const t = (now - t0) * 0.001;

      if (!isDragging) {
        velX *= 0.9;
        velY *= 0.9;
        targetRotY += velX;
        targetRotX += velY;
        if (Math.abs(velX) < 0.0015 && Math.abs(velY) < 0.0015) {
          targetRotY += autoSpin;
        }
      }

      group.rotation.y += (targetRotY - group.rotation.y) * 0.085;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.085;
      group.rotation.z = Math.sin(t * 0.55) * (reduced ? 0.04 : 0.1);
      group.position.y = Math.sin(t * 0.85) * bobAmp;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onUp);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [cacheBust]);

  return (
    <div
      ref={hostRef}
      className={className}
      data-testid="clean-sneaks-logo-cube"
      role="img"
      aria-label={`${KLEAN_SNEAKS.title} logo — drag to spin, tap to enter`}
    />
  );
}
