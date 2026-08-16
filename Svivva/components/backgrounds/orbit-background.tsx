"use client";

// Seeds Marketing Engine (Orbit) — "web" motif from the ORBIT graphic.
// A constellation web whose filaments pulse and tighten on scroll.

import { useRef, useEffect } from "react";
import * as THREE from "three";

const ACCENT = 0xc06010;

export default function OrbitBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000,
    );
    camera.position.z = 34;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    const count = 14;
    const pts = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 40,
      y: (Math.random() - 0.5) * 28,
      r: 6 + Math.random() * 10,
      a: Math.random() * Math.PI * 2,
      spd: 0.1 + Math.random() * 0.25,
    }));

    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const dots = new THREE.Points(
      dotGeo,
      new THREE.PointsMaterial({ color: ACCENT, size: 0.7, transparent: true, opacity: 0.85 }),
    );
    scene.add(dots);

    const lineGeo = new THREE.BufferGeometry();
    const maxLines = (count * (count - 1)) / 2;
    lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(maxLines * 6), 3));
    const lines = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.22 }),
    );
    scene.add(lines);

    const onScroll = () => {
      scrollRef.current = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
    };
    window.addEventListener("scroll", onScroll);

    let raf: number;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      const scroll = scrollRef.current;
      const dp = dots.geometry.attributes.position as THREE.BufferAttribute;
      const cx: number[] = [];
      const cy: number[] = [];
      pts.forEach((p, i) => {
        const orbit = p.r * (1 - scroll * 0.4);
        const x = p.x + Math.cos(p.a + t * p.spd) * orbit * 0.3;
        const y = p.y + Math.sin(p.a + t * p.spd) * orbit * 0.3;
        cx.push(x);
        cy.push(y);
        dp.setXYZ(i, x, y, 0);
      });
      dp.needsUpdate = true;

      const lp = lines.geometry.attributes.position as THREE.BufferAttribute;
      let n = 0;
      const thresh = 16 + scroll * 10;
      for (let i = 0; i < count; i++) {
        for (let j = i + 1; j < count; j++) {
          const dx = cx[i] - cx[j];
          const dy = cy[i] - cy[j];
          if (Math.sqrt(dx * dx + dy * dy) < thresh) {
            lp.setXYZ(n++, cx[i], cy[i], 0);
            lp.setXYZ(n++, cx[j], cy[j], 0);
          }
        }
      }
      for (let k = n; k < maxLines * 2; k++) lp.setXYZ(k, 0, 0, 0);
      lp.needsUpdate = true;
      (lines.material as THREE.LineBasicMaterial).opacity =
        0.18 + 0.12 * Math.sin(t * 2) + scroll * 0.1;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
