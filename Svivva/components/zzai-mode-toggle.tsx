"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { usePlatform } from "@/lib/platform-context";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabels?: boolean;
};

const SIZE_PX = { sm: 56, md: 110, lg: 220 } as const;

/**
 * Clear Three.js dual-logo toggle.
 * Front face = Signal (Yeoo / blue / lilies)
 * Back face  = Crest (ZZAI / magenta / cyan wings)
 * Click the glass card to flip.
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
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 0, 3.35);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(px, px, false);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      width: "100%",
      height: "100%",
      display: "block",
      cursor: "pointer",
    });
    renderer.domElement.setAttribute("aria-hidden", "true");

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(2.4, 2.6, 3.4);
    const fill = new THREE.DirectionalLight(0x5b8da8, 0.45);
    fill.position.set(-2.2, -0.8, 1.8);
    const backLight = new THREE.DirectionalLight(0xd94f9c, 0.35);
    backLight.position.set(0, 1.2, -2.4);
    scene.add(key, fill, backLight);

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

    // Glass slab so the toggle reads as a clear 3D object
    const slabGeo = new THREE.BoxGeometry(1.72, 1.72, 0.08);
    const slabMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.08,
      transmission: 0.72,
      thickness: 0.4,
      transparent: true,
      opacity: 0.35,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    card.add(slab);

    const planeGeo = new THREE.PlaneGeometry(1.52, 1.52);
    let frontMat: THREE.MeshPhysicalMaterial | null = null;
    let backMat: THREE.MeshPhysicalMaterial | null = null;

    const rimGeo = new THREE.TorusGeometry(1.08, 0.03, 18, 100);
    const rimMat = new THREE.MeshPhysicalMaterial({
      color: 0x5b8da8,
      metalness: 0.9,
      roughness: 0.18,
      emissive: 0x5b8da8,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2.2;
    card.add(rim);

    let disposed = false;
    // cache-bust so new logos show immediately after deploy
    const bust = "v3";
    Promise.all([
      loader.loadAsync(`/zzai-logo-signal.png?${bust}`).then(prep),
      loader.loadAsync(`/zzai-logo-crest.png?${bust}`).then(prep),
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
          roughness: 0.28,
          metalness: 0.12,
          clearcoat: 0.65,
          clearcoatRoughness: 0.2,
          side: THREE.FrontSide,
        });
        backMat = new THREE.MeshPhysicalMaterial({
          map: crestTex,
          transparent: true,
          roughness: 0.28,
          metalness: 0.12,
          clearcoat: 0.65,
          clearcoatRoughness: 0.2,
          side: THREE.FrontSide,
        });
        const front = new THREE.Mesh(planeGeo, frontMat);
        front.position.z = 0.05;
        const back = new THREE.Mesh(planeGeo.clone(), backMat);
        back.rotation.y = Math.PI;
        back.position.z = -0.05;
        card.add(front, back);
      })
      .catch(() => {
        frontMat = new THREE.MeshPhysicalMaterial({ color: 0x5b8da8 });
        backMat = new THREE.MeshPhysicalMaterial({ color: 0xd94f9c });
        const front = new THREE.Mesh(planeGeo, frontMat);
        const back = new THREE.Mesh(planeGeo.clone(), backMat);
        back.rotation.y = Math.PI;
        card.add(front, back);
      });

    let raf = 0;
    const clock = new THREE.Clock();
    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();
      const target = flipTargetRef.current;
      let cur = flipCurrentRef.current;
      let delta = target - cur;
      while (delta > Math.PI) delta -= Math.PI * 2;
      while (delta < -Math.PI) delta += Math.PI * 2;
      cur += delta * 0.14;
      flipCurrentRef.current = cur;

      card.rotation.y = cur;
      card.rotation.x = Math.sin(t * 0.85) * 0.08;
      card.position.y = Math.sin(t * 1.35) * 0.05;

      const signalish = Math.cos(cur) > 0;
      rimMat.color.setHex(signalish ? 0x5b8da8 : 0xd94f9c);
      rimMat.emissive.setHex(signalish ? 0x5b8da8 : 0xd94f9c);
      rim.rotation.z = t * 0.5;
      fill.intensity = signalish ? 0.55 : 0.2;
      backLight.intensity = signalish ? 0.2 : 0.55;

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
      planeGeo.dispose();
      slabGeo.dispose();
      slabMat.dispose();
      rimGeo.dispose();
      rimMat.dispose();
      frontMat?.map?.dispose();
      backMat?.map?.dispose();
      frontMat?.dispose();
      backMat?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [size]);

  const px = SIZE_PX[size];
  const isSignal = mode === "digital";

  return (
    <div
      className={`inline-flex flex-col sm:flex-row items-center gap-2 sm:gap-3 ${className}`}
      role="group"
      aria-label="ZZAI mode toggle"
    >
      <button
        type="button"
        onClick={() => setMode("digital")}
        className="order-2 sm:order-1 text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase transition-all"
        style={{
          color: "#5B8DA8",
          opacity: isSignal ? 1 : 0.35,
          textShadow: isSignal ? "0 0 12px rgba(91, 141, 168,0.55)" : "none",
        }}
        data-testid="button-platform-toggle-signal"
        title="Signal — Prompt to API"
      >
        Signal
      </button>

      <button
        type="button"
        aria-label={isSignal ? "Flip to Crest" : "Flip to Signal"}
        onClick={() => toggleMode()}
        className="order-1 sm:order-2 relative rounded-2xl overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B8DA8]"
        style={{
          width: px,
          height: px,
          borderColor: colors.primaryBorder,
          boxShadow: `0 0 0 1px ${colors.primaryBorder}, 0 0 28px ${colors.primaryBg}, inset 0 0 24px rgba(255,255,255,0.04)`,
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.65))",
        }}
        title="Click to flip logos — Signal ↔ Crest"
      >
        <div ref={hostRef} className="absolute inset-0" />
      </button>

      <button
        type="button"
        onClick={() => setMode("physical")}
        className="order-3 text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase transition-all"
        style={{
          color: "#D94F9C",
          opacity: !isSignal ? 1 : 0.35,
          textShadow: !isSignal ? "0 0 12px rgba(217, 79, 156,0.55)" : "none",
        }}
        data-testid="button-platform-toggle-crest"
        title="Crest — Manufacturing"
      >
        Crest
      </button>

      {showLabels && (
        <span className="order-4 text-center sm:text-left leading-tight sm:ml-1">
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
