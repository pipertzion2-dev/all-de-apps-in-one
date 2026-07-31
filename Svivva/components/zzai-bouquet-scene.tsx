"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import zzaiBouquet from "@/attached_assets/ZZAI_BOUQUET_2.png";

type Mode = "digital" | "physical";

type Props = {
  mode?: Mode;
  className?: string;
  /** CSS pixel size of the square canvas (default 280). */
  size?: number;
};

function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

const LOGO_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const LOGO_FRAG = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uHover;
  uniform float uGlitch;
  uniform float uBurst;
  uniform vec3 uTint;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv;

    // Soft organic sway — bouquet “breathes”
    uv.x += sin(uTime * 1.3 + uv.y * 6.0) * 0.004 * (0.4 + uHover);
    uv.y += cos(uTime * 1.1 + uv.x * 5.0) * 0.003 * (0.4 + uHover);

    // RGB split / Yeoo glitch on hover + burst
    float g = uGlitch * (0.35 + uHover * 0.9) + uBurst * 0.02;
    float slice = step(0.92, hash(vec2(floor(uv.y * 48.0), floor(uTime * 8.0))));
    uv.x += slice * (hash(vec2(uTime, uv.y)) - 0.5) * g * 0.08;

    float aberr = 0.0025 + uHover * 0.006 + uBurst * 0.01;
    float r = texture2D(uMap, uv + vec2(aberr, 0.0)).r;
    float ga = texture2D(uMap, uv).g;
    float b = texture2D(uMap, uv - vec2(aberr, 0.0)).b;
    float a = texture2D(uMap, uv).a;

    vec3 col = vec3(r, ga, b);

    // Iridescent rim shimmer across crest metal
    float rim = smoothstep(0.15, 0.55, length(uv - 0.5));
    float oil = sin(uTime * 2.0 + uv.x * 18.0 + uv.y * 12.0) * 0.5 + 0.5;
    vec3 iri = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.17, 0.84), oil);
    iri = mix(iri, vec3(0.85, 1.0, 0.2), sin(uTime + uv.y * 10.0) * 0.5 + 0.5);
    col = mix(col, col + iri * 0.35, rim * (0.25 + uHover * 0.45) * a);

    // Mode tint
    col = mix(col, col * uTint, 0.18 + uHover * 0.12);

    // Fine static grain on lettering zones
    float n = hash(uv * 900.0 + uTime * 0.4);
    col += (n - 0.5) * 0.08 * a * (0.5 + uHover);

    // Soft bloom pulse
    col *= 0.92 + 0.08 * sin(uTime * 2.4) + uBurst * 0.25;

    if (a < 0.04) discard;
    gl_FragColor = vec4(col, a);
  }
`;

const PARTICLE_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uHover;
  uniform float uBurst;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    float t = uTime * (0.4 + aSeed * 0.8) + aSeed * 40.0;
    vec3 p = position;

    // Spiral outward from crest
    float radius = length(p.xz) + uHover * 0.15 + uBurst * (0.4 + aSeed);
    float angle = atan(p.z, p.x) + uTime * (0.15 + aSeed * 0.25);
    p.x = cos(angle) * radius;
    p.z = sin(angle) * radius;
    p.y += sin(t) * 0.12 + uBurst * aSeed * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float size = aSize * (1.0 + uHover * 0.6 + uBurst);
    gl_PointSize = size * (180.0 / -mv.z);
    vAlpha = 0.35 + uHover * 0.4 + aSeed * 0.2;
  }
`;

const PARTICLE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, soft * vAlpha);
  }
`;

/**
 * Interactive ZZAI second-bouquet mark — glitch crest plane, iridescent shimmer,
 * orbiting signal particles, pointer parallax + click burst.
 */
export function ZzaiBouquetScene({ mode = "digital", className = "", size = 280 }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef(mode);
  const [webgl, setWebgl] = useState(true);
  modeRef.current = mode;

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebgl(false);
      return;
    }
    const mount = mountRef.current;
    if (!mount) return;

    let disposed = false;
    let raf = 0;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, down: 0 };
    const hover = { value: 0, target: 0 };
    const burst = { value: 0 };

    const w = mount.clientWidth || size;
    const h = mount.clientHeight || size;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 40);
    camera.position.set(0, 0.05, 3.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.style.cursor = "pointer";
    renderer.domElement.setAttribute("aria-label", "Interactive ZZAI bouquet");

    const root = new THREE.Group();
    scene.add(root);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const key = new THREE.DirectionalLight(0x5b8da8, 0.8);
    key.position.set(2, 3, 4);
    const fill = new THREE.DirectionalLight(0xd94f9c, 0.45);
    fill.position.set(-3, 1, 2);
    scene.add(ambient, key, fill);

    const uniforms = {
      uMap: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uGlitch: { value: 1 },
      uBurst: { value: 0 },
      uTint: { value: new THREE.Color(mode === "digital" ? 0xb8f7ff : 0xffd0f5) },
    };

    const logoMat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: LOGO_VERT,
      fragmentShader: LOGO_FRAG,
      transparent: true,
      depthWrite: false,
    });

    const logoMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), logoMat);
    root.add(logoMesh);

    // Soft backlight bloom disc
    const glowMat = new THREE.MeshBasicMaterial({
      color: mode === "digital" ? 0x5b8da8 : 0xd94f9c,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(new THREE.CircleGeometry(1.15, 64), glowMat);
    glow.position.z = -0.08;
    root.add(glow);

    // Orbiting signal particles
    const COUNT = 140;
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const seeds = new Float32Array(COUNT);
    const palette = [
      new THREE.Color(0x5b8da8),
      new THREE.Color(0xd94f9c),
      new THREE.Color(0xb8ff3c),
      new THREE.Color(0x7ad7ff),
      new THREE.Color(0xc77dff),
    ];
    for (let i = 0; i < COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.55 + Math.random() * 1.1;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.4;
      positions[i * 3 + 2] = Math.sin(a) * r;
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      sizes[i] = 2 + Math.random() * 5;
      seeds[i] = Math.random();
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    pGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    pGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

    const pUniforms = {
      uTime: uniforms.uTime,
      uHover: uniforms.uHover,
      uBurst: uniforms.uBurst,
    };
    const pMat = new THREE.ShaderMaterial({
      uniforms: pUniforms,
      vertexShader: PARTICLE_VERT,
      fragmentShader: PARTICLE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pGeo, pMat);
    root.add(points);

    // Thin iridescent ring (crest orbit)
    const ringGeo = new THREE.TorusGeometry(1.05, 0.012, 12, 96);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: 0xcfd6de,
      metalness: 0.9,
      roughness: 0.18,
      iridescence: 1,
      iridescenceIOR: 1.4,
      transparent: true,
      opacity: 0.55,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI * 0.42;
    root.add(ring);

    const loader = new THREE.TextureLoader();
    loader.load(
      "/zzai-bouquet-2.png",
      (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        uniforms.uMap.value = tex;
        logoMat.needsUpdate = true;
      },
      undefined,
      () => {
        if (!disposed) setWebgl(false);
      },
    );

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.tx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.ty = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const onEnter = () => {
      hover.target = 1;
    };
    const onLeave = () => {
      hover.target = 0;
      pointer.tx = 0;
      pointer.ty = 0;
    };
    const onDown = () => {
      burst.value = 1;
      pointer.down = 1;
    };
    const onUp = () => {
      pointer.down = 0;
    };

    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerenter", onEnter);
    renderer.domElement.addEventListener("pointerleave", onLeave);
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    const onResize = () => {
      if (!mount) return;
      const nw = mount.clientWidth || size;
      const nh = mount.clientHeight || size;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tintDigital = new THREE.Color(0xb8f7ff);
    const tintPhysical = new THREE.Color(0xffd0f5);
    const glowDigital = new THREE.Color(0x5b8da8);
    const glowPhysical = new THREE.Color(0xd94f9c);

    const clock = new THREE.Clock();
    const animate = () => {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      uniforms.uTime.value = reduceMotion ? 0 : t;

      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      hover.value += (hover.target - hover.value) * 0.08;
      burst.value *= 0.92;
      uniforms.uHover.value = hover.value;
      uniforms.uBurst.value = burst.value;
      uniforms.uGlitch.value = reduceMotion
        ? 0.3
        : 0.7 + hover.value * 0.6 + Math.sin(t * 3.0) * 0.05;

      const m = modeRef.current;
      uniforms.uTint.value.lerp(m === "digital" ? tintDigital : tintPhysical, 0.08);
      (glow.material as THREE.MeshBasicMaterial).color.lerp(
        m === "digital" ? glowDigital : glowPhysical,
        0.08,
      );
      (glow.material as THREE.MeshBasicMaterial).opacity =
        0.1 + hover.value * 0.16 + burst.value * 0.12;

      if (!reduceMotion) {
        root.rotation.y = pointer.x * 0.35;
        root.rotation.x = pointer.y * 0.28;
        root.position.x = pointer.x * 0.08;
        root.position.y = pointer.y * 0.06;
        const s = 1 + hover.value * 0.06 + burst.value * 0.04;
        root.scale.setScalar(s);
        ring.rotation.z = t * 0.25;
        ring.rotation.y = Math.sin(t * 0.4) * 0.15;
        points.rotation.y = t * 0.08;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerenter", onEnter);
      renderer.domElement.removeEventListener("pointerleave", onLeave);
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      logoMat.dispose();
      logoMesh.geometry.dispose();
      glowMat.dispose();
      glow.geometry.dispose();
      pMat.dispose();
      pGeo.dispose();
      ringMat.dispose();
      ringGeo.dispose();
      uniforms.uMap.value?.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [size]);

  if (!webgl) {
    return (
      <div
        className={`relative mx-auto ${className}`}
        style={{ width: size, height: size, maxWidth: "100%" }}
      >
        <Image
          src={zzaiBouquet}
          alt="ZZAI bouquet"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`relative mx-auto touch-none select-none ${className}`}
      style={{ width: size, height: size, maxWidth: "min(100%, 360px)", aspectRatio: "1 / 1" }}
      data-testid="zzai-bouquet-scene"
      title="Move and click — Signal particles react"
    />
  );
}
