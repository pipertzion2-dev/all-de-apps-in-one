"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePlatform } from "@/lib/platform-context";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabels?: boolean;
};

const SIZE_PX = { sm: 56, md: 96, lg: 140 } as const;

/**
 * Clear Three.js logo toggle: Signal (cyan/lily) ↔ Crest (magenta/ZZAI).
 * Two real logo textures on opposite faces of a 3D card — click flips mode.
 */
export function ZzaiModeToggle({ size = "md", className = "", showLabels = true }: Props) {
  const { mode, setMode, colors, toggleMode } = usePlatform();
  const hostRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef(toggleMode);
  const flipTargetRef = useRef(mode === "digital" ? 0 : Math.PI);
  const flipCurrentRef = useRef(flipTargetRef.current);

  useEffect(() => {
    toggleRef.current = toggleMode;
  }, [toggleMode]);

  useEffect(() => {
    flipTargetRef.current = mode === "digital" ? 0 : Math.PI;
  }, [mode]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const px = SIZE_PX[size];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
    camera.position.set(0, 0, 3.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(px, px, false);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "pointer";
    renderer.domElement.setAttribute("aria-hidden", "true");

    const ambient = new THREE.AmbientLight(0xffffff, 1.15);
    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(2.2, 2.4, 3.2);
    const rim = new THREE.DirectionalLight(0x00e5ff, 0.55);
    rim.position.set(-2.4, -1.2, 1.5);
    scene.add(ambient, key, rim);

    const loader = new THREE.TextureLoader();
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    const prep = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.needsUpdate = true;
      return tex;
    };

    const card = new THREE.Group();
    scene.add(card);

    const geometry = new THREE.PlaneGeometry(1.55, 1.55, 1, 1);
    let frontMat: THREE.MeshPhysicalMaterial | null = null;
    let backMat: THREE.MeshPhysicalMaterial | null = null;

    const ringGeo = new THREE.TorusGeometry(1.05, 0.028, 16, 96);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e5ff,
      metalness: 0.85,
      roughness: 0.22,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.15;
    card.add(ring);

    let disposed = false;
    Promise.all([
      loader.loadAsync("/zzai-logo-signal.png").then(prep),
      loader.loadAsync("/zzai-logo-crest.png").then(prep),
    ])
      .then(([signalTex, crestTex]) => {
        if (disposed) {
          signalTex.dispose();
          crestTex.dispose();
          return;
        }
        frontMat = new THREE.MeshPhysicalMaterial({
          map: signalTex,
          transparent: true,
          roughness: 0.35,
          metalness: 0.15,
          clearcoat: 0.55,
          clearcoatRoughness: 0.25,
          side: THREE.FrontSide,
        });
        backMat = new THREE.MeshPhysicalMaterial({
          map: crestTex,
          transparent: true,
          roughness: 0.35,
          metalness: 0.15,
          clearcoat: 0.55,
          clearcoatRoughness: 0.25,
          side: THREE.FrontSide,
        });
        const frontMesh = new THREE.Mesh(geometry, frontMat);
        const backMesh = new THREE.Mesh(geometry.clone(), backMat);
        backMesh.rotation.y = Math.PI;
        card.add(frontMesh, backMesh);
      })
      .catch(() => {
        frontMat = new THREE.MeshPhysicalMaterial({ color: 0x00e5ff, roughness: 0.5 });
        backMat = new THREE.MeshPhysicalMaterial({ color: 0xff2bd6, roughness: 0.5 });
        const frontMesh = new THREE.Mesh(geometry, frontMat);
        const backMesh = new THREE.Mesh(geometry.clone(), backMat);
        backMesh.rotation.y = Math.PI;
        card.add(frontMesh, backMesh);
      });

    const particles = new THREE.Group();
    scene.add(particles);
    const pGeo = new THREE.SphereGeometry(0.018, 8, 8);
    for (let i = 0; i < 18; i++) {
      const isCyan = i % 2 === 0;
      const m = new THREE.Mesh(
        pGeo,
        new THREE.MeshBasicMaterial({
          color: isCyan ? 0x00e5ff : 0xff2bd6,
          transparent: true,
          opacity: 0.55,
        }),
      );
      const a = (i / 18) * Math.PI * 2;
      m.position.set(Math.cos(a) * 1.25, Math.sin(a * 1.7) * 0.35, Math.sin(a) * 1.25);
      m.userData.phase = a;
      particles.add(m);
    }

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();
      const target = flipTargetRef.current;
      let cur = flipCurrentRef.current;
      const delta = ((target - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      cur += delta * 0.12;
      flipCurrentRef.current = cur;
      card.rotation.y = cur;
      card.rotation.x = Math.sin(t * 0.9) * 0.06;
      card.position.y = Math.sin(t * 1.4) * 0.04;

      const signalish = Math.cos(cur) > 0;
      ringMat.color.set(signalish ? 0x00e5ff : 0xff2bd6);
      ringMat.emissive.set(signalish ? 0x00e5ff : 0xff2bd6);
      ring.rotation.z = t * 0.55;

      particles.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const phase = mesh.userData.phase as number;
        mesh.position.y = Math.sin(t * 1.6 + phase) * 0.42;
        mesh.rotation.y = t + i;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onClick = () => toggleRef.current();
    renderer.domElement.addEventListener("click", onClick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("click", onClick);
      geometry.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      frontMat?.map?.dispose();
      backMat?.map?.dispose();
      frontMat?.dispose();
      backMat?.dispose();
      particles.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          (obj.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [size]);

  const px = SIZE_PX[size];
  const isSignal = mode === "digital";

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="group"
      aria-label="ZZAI mode"
    >
      <button
        type="button"
        onClick={() => setMode("digital")}
        className="hidden sm:block text-[10px] font-semibold tracking-[0.14em] uppercase transition-opacity"
        style={{ color: "#00E5FF", opacity: isSignal ? 1 : 0.35 }}
        data-testid="button-platform-toggle-signal"
        title="Signal — Prompt to API"
      >
        Signal
      </button>

      <div
        ref={hostRef}
        className="relative rounded-xl overflow-hidden"
        style={{
          width: px,
          height: px,
          boxShadow: `0 0 0 1px ${colors.primaryBorder}, 0 0 22px ${colors.primaryBg}`,
          background: "rgba(0,0,0,0.25)",
        }}
        title={
          isSignal
            ? "Signal — Prompt to API (click to flip)"
            : "Crest — Manufacturing (click to flip)"
        }
      />

      <button
        type="button"
        onClick={() => setMode("physical")}
        className="hidden sm:block text-[10px] font-semibold tracking-[0.14em] uppercase transition-opacity"
        style={{ color: "#FF2BD6", opacity: !isSignal ? 1 : 0.35 }}
        data-testid="button-platform-toggle-crest"
        title="Crest — Manufacturing"
      >
        Crest
      </button>

      {showLabels && (
        <span className="sm:hidden pr-1 text-left leading-tight">
          <span className="block text-[11px] font-semibold text-foreground">
            {isSignal ? "Signal" : "Crest"}
          </span>
          <span className="block text-[9px] text-muted-foreground">
            {isSignal ? "Prompt → API" : "Manufacture"}
          </span>
        </span>
      )}
    </div>
  );
}
