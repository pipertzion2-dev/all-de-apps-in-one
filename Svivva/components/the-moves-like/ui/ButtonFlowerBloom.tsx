"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { cn } from "@/lib/utils";

/** Cap concurrent WebGL flower scenes (buttons share a soft budget). */
let activeBlooms = 0;
const MAX_ACTIVE = 6;

type Tint = "blue" | "purple" | "mixed";
type PetalShape = "pointed" | "rounded" | "curved" | "layered" | "star" | "teardrop";

const GLASS_BLUE = new THREE.Color(0x6d91b3);
const GLASS_BLUE_SOFT = new THREE.Color(0xa8c0d4);
const GLASS_PURPLE = new THREE.Color(0xac81af);
const GLASS_PURPLE_SOFT = new THREE.Color(0xd4c0d6);
const GLASS_CREAM = new THREE.Color(0xf7fbfc);

const SHAPES: PetalShape[] = ["pointed", "rounded", "curved", "teardrop", "layered", "star"];

function petalGeometry(shape: PetalShape, w: number, l: number, h: number, layer: number) {
  switch (shape) {
    case "pointed": {
      const g = new THREE.ConeGeometry(w * 0.6, l, 4, 1);
      g.rotateX(Math.PI / 2);
      return g;
    }
    case "rounded": {
      const g = new THREE.SphereGeometry(w * 0.8, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.6);
      g.scale(1, 0.3, l / Math.max(w * 0.8, 0.01));
      return g;
    }
    case "curved":
      return new THREE.BoxGeometry(w * 0.7, h, l * 1.2);
    case "layered": {
      const layerScale = 1 - layer * 0.2;
      const g = new THREE.CircleGeometry(w * layerScale, 6);
      g.rotateX(-Math.PI / 2.5);
      return g;
    }
    case "star": {
      const g = new THREE.ConeGeometry(w * 0.4, l * 0.9, 3, 1);
      g.rotateX(Math.PI / 2);
      return g;
    }
    case "teardrop": {
      const g = new THREE.SphereGeometry(w * 0.5, 5, 4, 0, Math.PI * 2, 0, Math.PI * 0.7);
      g.scale(1.2, 0.25, l / Math.max(w * 0.5, 0.01));
      return g;
    }
    default:
      return new THREE.BoxGeometry(w, h, l);
  }
}

function makeHomeStyleFlower(tint: Tint, seed: number) {
  const group = new THREE.Group();
  const shape = SHAPES[seed % SHAPES.length];
  const blueFirst = tint === "blue" || (tint === "mixed" && seed % 2 === 0);
  const colors = blueFirst
    ? [GLASS_BLUE, GLASS_BLUE_SOFT, GLASS_PURPLE_SOFT]
    : [GLASS_PURPLE, GLASS_PURPLE_SOFT, GLASS_BLUE_SOFT];

  const petalCount = shape === "star" ? 10 : shape === "layered" ? 8 : 6;
  const petalWidth = shape === "star" ? 0.16 : 0.3;
  const petalLength = shape === "curved" ? 0.85 : 0.7;
  const openAngle = 0.5;
  const scale = 1;

  for (let p = 0; p < petalCount; p++) {
    const angle = (p / petalCount) * Math.PI * 2;
    const layer = Math.floor(p / 4);
    const layerOffset = shape === "layered" ? layer * 0.06 : 0;
    const w = petalWidth * scale;
    const l = petalLength * scale;
    const h = 0.05 * scale;
    const geometry = petalGeometry(shape, w, l, h, layer);

    const color1 = colors[p % colors.length];
    const color2 = colors[(p + 1) % colors.length];
    const color3 = colors[(p + 2) % colors.length];

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uBloom: { value: 1 },
        uHover: { value: 0.15 },
        uColor1: { value: color1 },
        uColor2: { value: color2 },
        uColor3: { value: color3 },
      },
      vertexShader: `
        uniform float uTime;
        uniform float uBloom;
        uniform float uHover;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          vPosition = position;
          vUv = uv;
          vec3 pos = position;
          float bloomFactor = uBloom * 0.55 + 0.45;
          pos.xz *= bloomFactor + uHover * 0.08;
          pos.y += uHover * 0.04;
          pos.x += sin(uTime * 1.5 + position.y * 2.0) * 0.012;
          pos.z += cos(uTime * 1.2 + position.x * 2.0) * 0.008;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform float uTime;
        uniform float uHover;
        varying vec3 vPosition;
        varying vec2 vUv;
        void main() {
          float tipGradient = smoothstep(-0.3, 0.4, vPosition.z);
          float sideGradient = smoothstep(-0.15, 0.15, vPosition.x) * 0.6;
          vec3 color = mix(uColor1, uColor2, tipGradient);
          color = mix(color, uColor3, sideGradient);
          float shimmer = sin(uTime * 3.0 + vPosition.z * 8.0) * 0.08 + 0.92;
          color *= shimmer;
          float rim = pow(max(0.0, 1.0 - abs(vPosition.x) * 4.0), 2.0) * 0.15;
          color += rim + uHover * 0.1;
          gl_FragColor = vec4(color, 0.95);
        }
      `,
      transparent: true,
      depthWrite: false,
    });

    const petal = new THREE.Mesh(geometry, material);
    const radius = 0.15 * scale * (shape === "layered" ? 1 - layer * 0.15 : 1);
    petal.position.x = Math.cos(angle) * radius;
    petal.position.z = Math.sin(angle) * radius;
    petal.position.y = 0.2 * scale + layerOffset;
    petal.rotation.y = angle;
    petal.rotation.z = openAngle + (shape === "layered" ? layer * 0.15 : 0);
    petal.userData.material = material;
    group.add(petal);
  }

  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.09 * scale, 10, 10),
    new THREE.MeshStandardMaterial({
      color: GLASS_CREAM,
      emissive: blueFirst ? GLASS_PURPLE : GLASS_BLUE,
      emissiveIntensity: 0.35,
      roughness: 0.4,
    }),
  );
  center.position.y = 0.22 * scale;
  group.add(center);

  group.userData.phase = seed * 0.7;
  return group;
}

/**
 * Home-screen style Three.js exotic flowers for glossy glass buttons.
 * Petal shapes + shimmer shaders match the site CRT flower field,
 * tinted to glass blue #6D91B3 / purple #AC81AF.
 */
export function ButtonFlowerBloom({
  className,
  tint = "mixed",
  density = "normal",
}: {
  className?: string;
  tint?: Tint;
  density?: "sparse" | "normal";
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let allowed = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        const on = Boolean(entry?.isIntersecting);
        if (on && !allowed && activeBlooms < MAX_ACTIVE) {
          activeBlooms += 1;
          allowed = true;
          setLive(true);
        } else if (!on && allowed) {
          activeBlooms = Math.max(0, activeBlooms - 1);
          allowed = false;
          setLive(false);
        }
      },
      { rootMargin: "40px", threshold: 0.05 },
    );
    io.observe(host);
    return () => {
      io.disconnect();
      if (allowed) {
        activeBlooms = Math.max(0, activeBlooms - 1);
        allowed = false;
      }
    };
  }, []);

  useEffect(() => {
    if (!live) return;
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let raf = 0;
    const w = Math.max(host.clientWidth, 48);
    const h = Math.max(host.clientHeight, 36);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 20);
    camera.position.set(0, 0.35, 2.8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "low-power",
      });
    } catch {
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    const canvas = renderer.domElement;
    canvas.style.cssText =
      "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;display:block;";
    host.appendChild(canvas);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(1.5, 2.2, 3);
    scene.add(key);
    const fill = new THREE.PointLight(0xac81af, 0.5);
    fill.position.set(-1.2, -0.2, 1.5);
    scene.add(fill);
    const rim = new THREE.PointLight(0x6d91b3, 0.4);
    rim.position.set(1.4, 0.6, -0.8);
    scene.add(rim);

    const count = density === "sparse" ? 2 : 3;
    const flowers: THREE.Group[] = [];
    for (let i = 0; i < count; i++) {
      const flower = makeHomeStyleFlower(tint, i + 3);
      const x = ((i % 3) - 1) * 0.85;
      const y = (Math.floor(i / 3) - 0.2) * 0.55 + (i % 2) * 0.12;
      flower.position.set(x, y, -0.15 - (i % 3) * 0.06);
      flower.scale.setScalar(0.72 + (i % 3) * 0.1);
      flower.rotation.x = -0.35;
      scene.add(flower);
      flowers.push(flower);
    }

    const ro = new ResizeObserver(() => {
      if (disposed || !host) return;
      const nw = Math.max(host.clientWidth, 48);
      const nh = Math.max(host.clientHeight, 36);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh, false);
    });
    ro.observe(host);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (t: number) => {
      if (disposed) return;
      const s = t * 0.001;
      if (!reduced) {
        flowers.forEach((f, i) => {
          const phase = f.userData.phase as number;
          f.rotation.y = Math.sin(s * 0.85 + phase) * 0.28;
          f.rotation.z = Math.cos(s * 0.65 + phase) * 0.1;
          f.position.y += Math.sin(s * 1.35 + phase + i) * 0.0003;
          f.traverse((obj) => {
            if (obj instanceof THREE.Mesh && obj.userData.material) {
              const mat = obj.userData.material as THREE.ShaderMaterial;
              if (mat.uniforms?.uTime) mat.uniforms.uTime.value = s;
            }
          });
        });
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      flowers.forEach((f) => {
        f.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const m = obj.material;
            if (Array.isArray(m)) m.forEach((x) => x.dispose());
            else m.dispose();
          }
        });
        scene.remove(f);
      });
      renderer.dispose();
      canvas.remove();
    };
  }, [live, tint, density]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className,
      )}
    />
  );
}
