"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { usePlatform } from "@/lib/platform-context";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabels?: boolean;
  /**
   * "flip"  — lightweight double-sided glass card (used in nav/sidebar, many instances).
   * "cube"  — advanced 3D cube with real depth, glowing edges, spring physics and
   *           bloom post-processing. Reserved for the single hero toggle.
   */
  variant?: "flip" | "cube";
};

const SIZE_PX = { sm: 56, md: 110, lg: 220 } as const;

/**
 * Clear Three.js dual-logo toggle.
 * Front face = Signal (Yeoo / blue / lilies)
 * Back face  = Crest (ZZAI / magenta / cyan wings)
 * Click the glass card (or spinning cube) to flip.
 */
export function ZzaiModeToggle({
  size = "md",
  className = "",
  showLabels = true,
  variant = "flip",
}: Props) {
  const { mode, setMode, colors, toggleMode } = usePlatform();
  const hostRef = useRef<HTMLDivElement>(null);
  const flipTargetRef = useRef(mode === "digital" ? 0 : Math.PI);
  const flipCurrentRef = useRef(flipTargetRef.current);

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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(px, px, false);
    renderer.setClearColor(0x000000, 0);
    if (variant === "cube") {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 0.95;
    }
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
    const fill = new THREE.DirectionalLight(0x00e5ff, 0.45);
    fill.position.set(-2.2, -0.8, 1.8);
    const backLight = new THREE.DirectionalLight(0xff2bd6, 0.35);
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
    // Source art has a lot of white margin around the crest — zoom in a
    // touch so the cube faces read as artwork, not a white square.
    const prepFace = (tex: THREE.Texture) => {
      prep(tex);
      const zoom = 1.32;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(1 / zoom, 1 / zoom);
      tex.offset.set((1 - 1 / zoom) / 2, (1 - 1 / zoom) / 2);
      return tex;
    };

    const card = new THREE.Group();
    scene.add(card);

    const disposables: Array<{ dispose: () => void }> = [];
    let frontMat: THREE.MeshPhysicalMaterial | null = null;
    let backMat: THREE.MeshPhysicalMaterial | null = null;

    // Edge/rim materials react to mode — declared up front so the render
    // loop can retint them regardless of which variant built the scene.
    const edgeMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 0.55,
      metalness: 0.85,
      roughness: 0.25,
    });

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;

    if (variant === "cube") {
      // Real 3D cube: signal + crest on opposite faces, glowing edge
      // faces on the other four sides so it reads as a solid gem, not a
      // flat card. Bloom post-processing gives the neon edges a real glow.
      const cubeSize = 1.55;
      const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize, 1, 1, 1);

      const placeholderMat = () => edgeMat.clone();
      // BoxGeometry material order: +x, -x, +y, -y, +z, -z
      const materials: THREE.MeshStandardMaterial[] = [
        placeholderMat(),
        placeholderMat(),
        placeholderMat(),
        placeholderMat(),
        placeholderMat(), // +z (front / signal)
        placeholderMat(), // -z (back / crest)
      ];
      const cube = new THREE.Mesh(cubeGeo, materials);
      card.add(cube);
      disposables.push(cubeGeo, ...materials);

      const bevelGeo = new THREE.BoxGeometry(cubeSize * 1.001, cubeSize * 1.001, cubeSize * 1.001);
      const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(bevelGeo),
        new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 }),
      );
      card.add(wire);
      disposables.push(bevelGeo, wire.geometry, wire.material as THREE.Material);

      const bust = "v3";
      Promise.all([
        loader.loadAsync(`/zzai-logo-signal.png?${bust}`).then(prepFace),
        loader.loadAsync(`/zzai-logo-crest.png?${bust}`).then(prepFace),
      ])
        .then(([signalTex, crestTex]) => {
          if (disposed) {
            signalTex.dispose();
            crestTex.dispose();
            return;
          }
          const front = new THREE.MeshPhysicalMaterial({
            map: signalTex,
            roughness: 0.55,
            metalness: 0.02,
            clearcoat: 0.25,
            clearcoatRoughness: 0.4,
          });
          const back = new THREE.MeshPhysicalMaterial({
            map: crestTex,
            roughness: 0.55,
            metalness: 0.02,
            clearcoat: 0.25,
            clearcoatRoughness: 0.4,
          });
          materials[4].dispose();
          materials[5].dispose();
          materials[4] = front;
          materials[5] = back;
          cube.material = materials;
          frontMat = front;
          backMat = back;
          disposables.push(front, back);
        })
        .catch(() => {
          /* keep glowing edge placeholders on both faces */
        });

      // Bloom-enabled composer — only for the advanced cube variant.
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(dpr);
      composer.setSize(px, px);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(px, px), 0.42, 0.4, 0.86);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    } else {
      // Lightweight flat glass card used everywhere else (nav, sidebar).
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
      disposables.push(slabGeo, slabMat);

      const rimGeo = new THREE.TorusGeometry(1.08, 0.03, 18, 100);
      const rim = new THREE.Mesh(rimGeo, edgeMat);
      rim.rotation.x = Math.PI / 2.2;
      card.add(rim);
      disposables.push(rimGeo);

      const planeGeo = new THREE.PlaneGeometry(1.52, 1.52);
      disposables.push(planeGeo);

      const bust = "v2";
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
          disposables.push(frontMat, backMat);
        })
        .catch(() => {
          frontMat = new THREE.MeshPhysicalMaterial({ color: 0x00e5ff });
          backMat = new THREE.MeshPhysicalMaterial({ color: 0xff2bd6 });
          const front = new THREE.Mesh(planeGeo, frontMat);
          const back = new THREE.Mesh(planeGeo.clone(), backMat);
          back.rotation.y = Math.PI;
          card.add(front, back);
          disposables.push(frontMat, backMat);
        });
    }

    let disposed = false;
    let raf = 0;
    const clock = new THREE.Clock();
    // Spring physics (critically-damped-ish) for the cube's snap-to-target
    // rotation — gives the flip a little overshoot/bounce instead of a
    // linear ease, which reads as a much more "advanced" interaction.
    const velocity = { y: 0 };
    const tick = () => {
      if (disposed) return;
      const t = clock.getElapsedTime();
      const target = flipTargetRef.current;
      let cur = flipCurrentRef.current;

      if (variant === "cube") {
        let delta = target - cur;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        const spring = 32;
        const damping = 7.2;
        velocity.y += (delta * spring - velocity.y * damping) * (1 / 60);
        cur += velocity.y * (1 / 60);
      } else {
        let delta = target - cur;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        cur += delta * 0.14;
      }
      flipCurrentRef.current = cur;

      card.rotation.y = cur;
      card.rotation.x =
        variant === "cube" ? Math.sin(t * 0.6) * 0.16 + 0.08 : Math.sin(t * 0.85) * 0.08;
      card.position.y = Math.sin(t * 1.35) * 0.05;

      const signalish = Math.cos(cur) > 0;
      edgeMat.color.setHex(signalish ? 0x00e5ff : 0xff2bd6);
      edgeMat.emissive.setHex(signalish ? 0x00e5ff : 0xff2bd6);
      edgeMat.emissiveIntensity = variant === "cube" ? 0.75 + Math.abs(Math.sin(cur)) * 0.5 : 0.4;
      fill.intensity = signalish ? 0.55 : 0.2;
      backLight.intensity = signalish ? 0.2 : 0.55;

      if (composer) {
        composer.render();
      } else {
        renderer.render(scene, camera);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    // No click listener on the canvas itself — the surrounding <button>
    // handles the click and native events bubble up from the canvas to it,
    // so wiring both would fire toggleMode() twice per click.

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      disposables.forEach((d) => d.dispose());
      edgeMat.dispose();
      frontMat?.map?.dispose();
      backMat?.map?.dispose();
      composer?.dispose();
      bloomPass?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === host) host.removeChild(renderer.domElement);
    };
  }, [size, variant]);

  const px = SIZE_PX[size];
  const isSignal = mode === "digital";
  // The "sm" size lives in tight nav/sidebar bars — flanking Signal/Crest
  // text plus a caption wrapped onto multiple lines there and read as
  // clutter. Render just the icon in that spot; the mode is still fully
  // explained via title/aria-label for accessibility.
  const compact = size === "sm";

  const iconButton = (
    <button
      type="button"
      aria-label={
        isSignal
          ? "ZZAI mode: Signal. Click to flip to Crest."
          : "ZZAI mode: Crest. Click to flip to Signal."
      }
      onClick={() => toggleMode()}
      className="relative rounded-2xl overflow-hidden border bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
      style={{
        width: px,
        height: px,
        borderColor: colors.primaryBorder,
        boxShadow: `0 0 0 1px ${colors.primaryBorder}, 0 0 ${compact ? 14 : 28}px ${colors.primaryBg}`,
        background: "transparent",
      }}
      title="Click to flip logos — Signal ↔ Crest"
    >
      <div ref={hostRef} className="absolute inset-0" />
    </button>
  );

  if (compact) {
    return <div className={`inline-flex items-center ${className}`}>{iconButton}</div>;
  }

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
          color: "#00E5FF",
          opacity: isSignal ? 1 : 0.35,
          textShadow: isSignal ? "0 0 12px rgba(0,229,255,0.55)" : "none",
        }}
        data-testid="button-platform-toggle-signal"
        title="Signal — Prompt to API"
      >
        Signal
      </button>

      <div className="order-1 sm:order-2">{iconButton}</div>

      <button
        type="button"
        onClick={() => setMode("physical")}
        className="order-3 text-[10px] sm:text-[11px] font-semibold tracking-[0.16em] uppercase transition-all"
        style={{
          color: "#FF2BD6",
          opacity: !isSignal ? 1 : 0.35,
          textShadow: !isSignal ? "0 0 12px rgba(255,43,214,0.55)" : "none",
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
