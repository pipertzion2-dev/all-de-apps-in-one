"use client";

import { useMemo, useRef, useState } from "react";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  connected: boolean;
  available: boolean;
  oauthUrl: string;
  label?: string;
};

/** Procedural woodland-camo texture drawn to a 2D canvas, mapped onto the sphere. */
function makeCamoTexture(connected: boolean): THREE.CanvasTexture {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;

  const palette = connected
    ? ["#1f3a2a", "#2e5a3c", "#3f7a4f", "#16261c", "#5ba86b"] // green "connected" camo
    : ["#2d3a22", "#4b5d34", "#8a8453", "#3b2f24", "#a7a86d"]; // classic woodland

  ctx.fillStyle = palette[0];
  ctx.fillRect(0, 0, size, size);

  // Organic patches: clusters of overlapping circles per color layer (tiles seamlessly-ish).
  const blob = (cx: number, cy: number, color: string) => {
    ctx.fillStyle = color;
    const lobes = 6 + Math.floor(Math.random() * 6);
    for (let i = 0; i < lobes; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * 46;
      const r = 18 + Math.random() * 38;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  for (let layer = 1; layer < palette.length; layer++) {
    const count = 10 - layer;
    for (let i = 0; i < count; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      blob(x, y, palette[layer]);
      // wrap copies so the seam is less obvious on the sphere
      blob(x - size, y, palette[layer]);
      blob(x, y - size, palette[layer]);
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function CamoSphere({ connected, interactive }: { connected: boolean; interactive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const texture = useMemo(() => makeCamoTexture(connected), [connected]);
  const targetScale = useRef(1);

  useFrame((_, delta) => {
    const m = meshRef.current;
    if (!m) return;
    m.rotation.y += delta * (hovered ? 0.9 : 0.32);
    m.rotation.x += delta * 0.06;
    targetScale.current = hovered && interactive ? 1.08 : 1;
    const s = THREE.MathUtils.lerp(m.scale.x, targetScale.current, 0.15);
    m.scale.setScalar(s);
  });

  return (
    <mesh
      ref={meshRef}
      onPointerOver={() => {
        if (!interactive) return;
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "";
      }}
    >
      <sphereGeometry args={[1.35, 96, 96]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.62}
        metalness={0.18}
        emissive={connected ? new THREE.Color("#1f5a33") : new THREE.Color("#3a4a22")}
        emissiveIntensity={hovered ? 0.5 : 0.22}
      />
    </mesh>
  );
}

export default function GscConnectOrb({ connected, available, oauthUrl, label }: Props) {
  const interactive = !connected && available;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (interactive) window.location.href = oauthUrl;
  };

  const caption = connected
    ? "Connected"
    : available
      ? label || "Connect Google Search Console"
      : "Setup required";

  return (
    <div className="relative mx-auto" style={{ width: 220, height: 220 }}>
      {/* glow ring */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-50"
        style={{
          background: connected
            ? "radial-gradient(circle, rgba(46,150,80,0.55), transparent 70%)"
            : "radial-gradient(circle, rgba(91,168,160,0.45), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 rounded-full overflow-hidden ring-2"
        style={{
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
          borderColor: connected ? "rgba(46,150,80,0.6)" : "rgba(91,168,160,0.55)",
        }}
        onClick={() => {
          if (interactive) window.location.href = oauthUrl;
        }}
        role={interactive ? "button" : undefined}
        aria-label={interactive ? "Connect Google Search Console" : undefined}
        tabIndex={interactive ? 0 : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === "Enter" || e.key === " ")) {
            window.location.href = oauthUrl;
          }
        }}
      >
        <Canvas camera={{ position: [0, 0, 3.4], fov: 45 }} dpr={[1, 2]} gl={{ alpha: true }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[3, 4, 5]} intensity={1.4} />
          <pointLight position={[-3, -2, 2]} intensity={0.6} color="#9aa06b" />
          <group onClick={handleClick}>
            <CamoSphere connected={connected} interactive={interactive} />
          </group>
        </Canvas>
      </div>

      {/* center label overlay (click passes through to the orb) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-white text-center leading-tight"
          style={{
            background: "rgba(0,0,0,0.42)",
            backdropFilter: "blur(2px)",
            maxWidth: 150,
          }}
        >
          {caption}
        </span>
      </div>
    </div>
  );
}
