"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STIEHL_LOGO_CUBE_URL } from "@/lib/clean-sneaks/assets";

type Props = {
  className?: string;
  /** Bust query so cache refreshes when the asset changes. */
  cacheBust?: string;
};

/**
 * Six-sided transparent logo cube — the Clean Sneaks homepage entry brand.
 * Same artwork on every face; continuous spin so the mark reads in 3D.
 */
export function CleanSneaksLogoCube({ className = "", cacheBust = "v1" }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      pointerEvents: "none",
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
      new THREE.EdgesGeometry(new THREE.BoxGeometry(cubeSize * 1.002, cubeSize * 1.002, cubeSize * 1.002)),
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
    const t0 = performance.now();
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

    const spinX = reduced ? 0.08 : 0.38;
    const spinY = reduced ? 0.12 : 0.52;
    const spinZ = reduced ? 0.04 : 0.18;

    const tick = (now: number) => {
      if (disposed) return;
      const t = (now - t0) * 0.001;
      group.rotation.x = t * spinX;
      group.rotation.y = t * spinY;
      group.rotation.z = Math.sin(t * 0.55) * spinZ;
      group.position.y = Math.sin(t * 0.85) * (reduced ? 0.02 : 0.08);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
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
      aria-label="Clean Sneaks logo — rotating transparent cube"
    />
  );
}
