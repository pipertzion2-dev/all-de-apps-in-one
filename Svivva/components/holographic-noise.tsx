"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

const VERTEX_SHADER = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    val += amp * noise(p);
    p *= 2.0;
    amp *= 0.5;
  }
  return val;
}

float starShape(vec2 p, float size) {
  float d = length(p);
  float rays = min(abs(p.x), abs(p.y)) / max(d, 0.001);
  float star = smoothstep(size, 0.0, d) * (0.4 + 0.6 * rays);
  float glow = smoothstep(size * 3.0, 0.0, d) * 0.3;
  return star + glow;
}

float sparkleLayer(vec2 uv, float gridScale, float timeSpeed, float seed, float sizeMin, float sizeMax) {
  vec2 grid = floor(uv * gridScale);
  vec2 local = fract(uv * gridScale) - 0.5;
  float rnd = hash(grid + seed);
  float vis = step(0.7, rnd);
  float phase = rnd * 6.28 + uTime * timeSpeed;
  float pulse = 0.5 + 0.5 * sin(phase);
  pulse = pulse * pulse;
  float sz = mix(sizeMin, sizeMax, hash(grid + seed + 100.0));
  float ang = hash(grid + seed + 200.0) * 3.14159;
  float ca = cos(ang);
  float sa = sin(ang);
  vec2 rotated = vec2(ca * local.x + sa * local.y, -sa * local.x + ca * local.y);
  return starShape(rotated, sz) * vis * pulse;
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.25;

  float grain = hash(uv * uResolution * 4.0 + fract(uTime * 73.0)) * 0.3;
  float grain2 = hash(uv * uResolution * 7.0 + fract(uTime * 41.0 + 5.0)) * 0.18;

  float n1 = fbm(uv * 6.0 + t * 0.7);
  float n2 = fbm(uv * 11.0 - t * 0.5 + 3.0);
  float n3 = fbm(uv * 4.0 + vec2(t * 0.35, -t * 0.6));

  float shimmer = sin(uv.x * 30.0 + t * 4.0 + n1 * 6.0) * 0.05;
  shimmer += cos(uv.y * 22.0 - t * 3.0 + n2 * 5.0) * 0.04;

  float sLarge = sparkleLayer(uv, 6.0, 1.2, 0.0, 0.12, 0.22);
  float sMed = sparkleLayer(uv, 12.0, 1.8, 50.0, 0.08, 0.15);
  float sSmall = sparkleLayer(uv, 22.0, 2.5, 100.0, 0.05, 0.10);
  float sTiny = sparkleLayer(uv, 40.0, 3.2, 150.0, 0.03, 0.07);

  vec3 burgundy = vec3(0.42, 0.17, 0.29);
  vec3 rose = vec3(0.88, 0.40, 0.48);
  vec3 deeprose = vec3(0.75, 0.30, 0.42);
  vec3 purple = vec3(0.55, 0.32, 0.68);
  vec3 mauve = vec3(0.70, 0.45, 0.60);
  vec3 cyan = vec3(0.45, 0.75, 0.78);
  vec3 gold = vec3(0.90, 0.82, 0.65);
  vec3 white = vec3(1.0, 0.97, 0.95);

  float blend = n1 * 0.45 + n2 * 0.35 + shimmer + n3 * 0.2;
  vec3 color;
  if (blend < 0.14) {
    color = mix(burgundy, deeprose, blend * 7.143);
  } else if (blend < 0.26) {
    color = mix(deeprose, purple, (blend - 0.14) * 8.333);
  } else if (blend < 0.38) {
    color = mix(purple, rose, (blend - 0.26) * 8.333);
  } else if (blend < 0.50) {
    color = mix(rose, mauve, (blend - 0.38) * 8.333);
  } else if (blend < 0.60) {
    color = mix(mauve, cyan, (blend - 0.50) * 10.0);
  } else if (blend < 0.72) {
    color = mix(cyan, gold, (blend - 0.60) * 8.333);
  } else if (blend < 0.84) {
    color = mix(gold, burgundy, (blend - 0.72) * 8.333);
  } else {
    color = mix(burgundy, purple, (blend - 0.84) * 6.25);
  }

  color += (grain + grain2) * 0.25;

  vec3 sparkleWhite = vec3(1.0, 0.96, 0.93);
  color = mix(color, sparkleWhite, sLarge * 0.9);
  color = mix(color, sparkleWhite, sMed * 0.75);
  color = mix(color, sparkleWhite, sSmall * 0.6);
  color = mix(color, sparkleWhite, sTiny * 0.45);

  float totalSparkle = sLarge + sMed * 0.7 + sSmall * 0.5 + sTiny * 0.3;
  float alpha = 0.45 + n3 * 0.12 + totalSparkle * 0.5 + grain * 0.06;
  alpha = min(alpha, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;

const TEX_SIZE = 256;

type FrameCallback = (source: HTMLCanvasElement) => void;

interface NoiseEngine {
  subscribe: (cb: FrameCallback) => () => void;
}

let globalEngine: NoiseEngine | null = null;

function getNoiseEngine(): NoiseEngine {
  if (globalEngine) return globalEngine;

  const subscribers = new Set<FrameCallback>();

  const offscreen = document.createElement("canvas");
  offscreen.width = TEX_SIZE;
  offscreen.height = TEX_SIZE;

  const renderer = new THREE.WebGLRenderer({
    canvas: offscreen,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setSize(TEX_SIZE, TEX_SIZE, false);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(TEX_SIZE, TEX_SIZE) },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    transparent: true,
    depthTest: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));

  const clock = new THREE.Clock();
  let running = false;

  const animate = () => {
    if (!running) return;
    requestAnimationFrame(animate);
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    subscribers.forEach((cb) => cb(offscreen));
  };

  const ensureRunning = () => {
    if (!running) {
      running = true;
      clock.start();
      animate();
    }
  };

  globalEngine = {
    subscribe(cb: FrameCallback) {
      subscribers.add(cb);
      ensureRunning();
      return () => {
        subscribers.delete(cb);
      };
    },
  };

  return globalEngine;
}

export function HolographicNoise({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = TEX_SIZE;
    canvas.height = TEX_SIZE;

    const engine = getNoiseEngine();
    const unsub = engine.subscribe((source) => {
      ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
      ctx.drawImage(source, 0, 0);
    });

    return unsub;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ mixBlendMode: "overlay", borderRadius: "inherit", opacity: 0.85 }}
      data-testid="canvas-holographic-noise"
    />
  );
}
