import * as THREE from "three";
import type { GraphicPalette } from "@/lib/artwork-palettes";

export type BloomLayerMaterial = THREE.ShaderMaterial & {
  userData: { bloomUniform: { value: number }; timeUniform: { value: number } };
};

export function paletteColors(palette: GraphicPalette): THREE.Color[] {
  return [
    new THREE.Color(palette.primary),
    new THREE.Color(palette.secondary),
    new THREE.Color(palette.tertiary),
    new THREE.Color(palette.highlight),
    new THREE.Color(palette.wire),
  ];
}

/** Multi-color grain shader — same family as homepage CRT flowers. */
export function createBloomLayerMaterial(
  colors: THREE.Color[],
  noiseLevel = 0.14,
): BloomLayerMaterial {
  const uBloom = { value: 0 };
  const uTime = { value: 0 };
  const uHover = { value: 0 };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime,
      uBloom,
      uHover,
      uNoiseLevel: { value: noiseLevel },
      uColor1: { value: colors[0] },
      uColor2: { value: colors[1 % colors.length] },
      uColor3: { value: colors[2 % colors.length] },
      uColor4: { value: colors[3 % colors.length] },
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
        float bloomFactor = uBloom * 0.62 + 0.38;
        pos.xz *= bloomFactor + uHover * 0.1;
        pos.y += uHover * 0.05 + sin(uTime * 1.4 + position.x * 3.0) * 0.015 * bloomFactor;
        pos.x += sin(uTime * 1.5 + position.y * 2.0) * 0.012;
        pos.z += cos(uTime * 1.2 + position.x * 2.0) * 0.01;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      uniform vec3 uColor4;
      uniform float uTime;
      uniform float uHover;
      uniform float uNoiseLevel;
      varying vec3 vPosition;
      varying vec2 vUv;

      float hash(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * 0.1031);
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float grain(vec2 uv, float t) {
        float n1 = hash(uv * 320.0 + t * 1.7);
        float n2 = hash(uv * 480.0 - t * 2.3);
        return mix(n1, n2, 0.5);
      }

      void main() {
        float tip = smoothstep(-0.35, 0.45, vPosition.z);
        float side = smoothstep(-0.2, 0.2, vPosition.x);
        vec3 color = mix(uColor1, uColor2, tip);
        color = mix(color, uColor3, side * 0.55);
        color = mix(color, uColor4, hash(vUv * 12.0) * 0.22);

        float shimmer = sin(uTime * 2.8 + vPosition.z * 7.0) * 0.09 + 0.91;
        color *= shimmer;
        color += uHover * 0.12;

        float n = grain(vUv + vPosition.xz * 2.0, uTime * 0.4);
        float n2 = grain(vUv * 1.5 + vPosition.yz * 3.0, uTime * 0.6 + 7.0);
        float combined = mix(n, n2, 0.45);
        vec3 noiseTint = mix(
          vec3(combined * 0.65, combined * 0.8, combined),
          vec3(combined, combined * 0.7, combined * 0.85),
          step(0.5, hash(vUv * 50.0))
        );
        color = mix(color, color + (noiseTint - 0.5) * 2.0, uNoiseLevel);
        color += (hash(vUv * 600.0 + uTime * 0.2) - 0.5) * uNoiseLevel * 0.35;

        float rim = pow(1.0 - abs(vPosition.x) * 3.5, 2.0) * 0.18;
        color += rim;

        gl_FragColor = vec4(color, 0.94);
      }
    `,
    transparent: true,
    depthWrite: true,
  }) as BloomLayerMaterial;

  material.userData = { bloomUniform: uBloom, timeUniform: uTime };
  return material;
}

export function createAccentPhysical(color: number, opacity = 0.72): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.42,
    roughness: 0.28,
    transparent: true,
    opacity,
    clearcoat: 0.55,
    clearcoatRoughness: 0.18,
    side: THREE.DoubleSide,
  });
}

/** Digi-camo tile texture for overlay planes. */
export function createCamoTileTexture(seed: number, palette: GraphicPalette): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const cols = [
    `rgba(${(palette.primary >> 16) & 255},${(palette.primary >> 8) & 255},${palette.primary & 255},0.42)`,
    `rgba(${(palette.secondary >> 16) & 255},${(palette.secondary >> 8) & 255},${palette.secondary & 255},0.38)`,
    `rgba(${(palette.tertiary >> 16) & 255},${(palette.tertiary >> 8) & 255},${palette.tertiary & 255},0.35)`,
    null,
    `rgba(${(palette.highlight >> 16) & 255},${(palette.highlight >> 8) & 255},${palette.highlight & 255},0.32)`,
    `rgba(${(palette.wire >> 16) & 255},${(palette.wire >> 8) & 255},${palette.wire & 255},0.3)`,
  ];

  const block = 10;
  const rnd = (x: number, y: number) => {
    const n = Math.sin(seed * 12.9898 + x * 78.233 + y * 45.164) * 43758.5453;
    return n - Math.floor(n);
  };

  for (let y = 0; y < size; y += block) {
    for (let x = 0; x < size; x += block) {
      const idx = Math.floor(rnd(x / block, y / block) * cols.length);
      const fill = cols[idx];
      if (fill) {
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, block, block);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
