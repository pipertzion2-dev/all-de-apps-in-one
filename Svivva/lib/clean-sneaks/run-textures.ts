import * as THREE from "three";

function canvasTex(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  opts?: { repeat?: boolean; normal?: boolean },
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = opts?.normal ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  if (opts?.repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  }
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Worn urban asphalt with aggregate speckle and hairline cracks. */
export function asphaltTextures(): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const map = canvasTex(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#1a1f28";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 12000; i++) {
        const g = 26 + Math.random() * 22;
        ctx.fillStyle = `rgb(${g},${g + 2},${g + 6})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1);
      }
      ctx.strokeStyle = "rgba(0,0,0,0.15)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        let x = Math.random() * w;
        let y = Math.random() * h;
        ctx.moveTo(x, y);
        for (let j = 0; j < 6; j++) {
          x += (Math.random() - 0.5) * 40;
          y += (Math.random() - 0.5) * 40;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    },
    { repeat: true },
  );

  const roughnessMap = canvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#888";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4000; i++) {
        const v = 120 + Math.random() * 100;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    },
    { repeat: true },
  );

  const normalMap = canvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#8080ff";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        const v = 110 + Math.random() * 40;
        ctx.fillStyle = `rgb(${128},${128},${v})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
    },
    { repeat: true, normal: true },
  );

  map.repeat.set(4, 8);
  roughnessMap.repeat.set(4, 8);
  normalMap.repeat.set(4, 8);
  return { map, roughnessMap, normalMap };
}

/** Concrete sidewalk slab texture. */
export function sidewalkTexture(): THREE.CanvasTexture {
  return canvasTex(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#2a3038";
      ctx.fillRect(0, 0, w, h);
      const slab = 64;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      for (let y = 0; y < h; y += slab) {
        for (let x = 0; x < w; x += slab) {
          ctx.strokeRect(x + 1, y + 1, slab - 2, slab - 2);
          for (let i = 0; i < 30; i++) {
            const g = 38 + Math.random() * 18;
            ctx.fillStyle = `rgba(${g},${g},${g + 4},0.4)`;
            ctx.fillRect(x + Math.random() * slab, y + Math.random() * slab, 2, 1);
          }
        }
      }
    },
    { repeat: true },
  );
}

/** Lane dash markings (emissive strip atlas). */
export function laneDashTexture(): THREE.CanvasTexture {
  return canvasTex(
    64,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#e8ecf4";
      ctx.fillRect(w * 0.25, 0, w * 0.5, h * 0.45);
    },
    { repeat: true },
  );
}

/** Leather grain for sneaker upper. */
export function leatherTextures(): {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
} {
  const map = canvasTex(
    512,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#f0f0f4";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 8000; i++) {
        const v = 230 + Math.random() * 20;
        ctx.fillStyle = `rgba(${v},${v},${v + 2},0.35)`;
        const x = Math.random() * w;
        const y = Math.random() * h;
        ctx.beginPath();
        ctx.ellipse(
          x,
          y,
          3 + Math.random() * 5,
          1 + Math.random() * 2,
          Math.random() * Math.PI,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    },
    { repeat: true },
  );

  const roughnessMap = canvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#606060";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2000; i++) {
        const v = 80 + Math.random() * 120;
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    },
    { repeat: true },
  );

  const normalMap = canvasTex(
    256,
    256,
    (ctx, w, h) => {
      ctx.fillStyle = "#8080ff";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 1500; i++) {
        const nx = 120 + Math.random() * 16;
        ctx.fillStyle = `rgb(128,128,${nx})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1);
      }
    },
    { repeat: true, normal: true },
  );

  map.repeat.set(2, 2);
  roughnessMap.repeat.set(2, 2);
  normalMap.repeat.set(2, 2);
  return { map, roughnessMap, normalMap };
}

/** Rubber sole tread pattern. */
export function soleTreadTexture(): THREE.CanvasTexture {
  return canvasTex(
    256,
    512,
    (ctx, w, h) => {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1a1a1a";
      for (let y = 0; y < h; y += 18) {
        for (let x = 0; x < w; x += 14) {
          ctx.beginPath();
          ctx.arc(x + 7, y + 9, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
    { repeat: true },
  );
}

const VEGAS_NEON = ["#ff2d8a", "#ffb347", "#4de8ff", "#ff5ec8", "#ffd166"] as const;

const facadeCache = new Map<number, THREE.CanvasTexture>();

function vegasBuildingFacadeTexture(seed: number): THREE.CanvasTexture {
  return canvasTex(128, 512, (ctx, w, h) => {
    const rnd = (n: number) => ((seed * 997 + n * 131) % 1000) / 1000;

    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#1c0a28");
    bg.addColorStop(0.45, "#100818");
    bg.addColorStop(1, "#06040a");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 5; i++) {
      const x = rnd(i) * (w - 10) + 5;
      const color = VEGAS_NEON[Math.floor(rnd(i + 11) * VEGAS_NEON.length)]!;
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.12 + rnd(i + 2) * 0.28;
      ctx.fillRect(x, h * 0.08, 2 + rnd(i + 3) * 5, h * 0.78);
      ctx.globalAlpha = 1;
    }

    for (let i = 0; i < 48; i++) {
      if (rnd(i + 40) < 0.38) continue;
      const wx = rnd(i + 50) * (w - 10) + 5;
      const wy = rnd(i + 60) * (h - 14) + 7;
      const lit = rnd(i + 70) > 0.42;
      ctx.fillStyle = lit
        ? `rgba(255,${175 + Math.floor(rnd(i) * 70)},${90 + Math.floor(rnd(i + 1) * 90)},${0.35 + rnd(i + 2) * 0.55})`
        : "rgba(6,4,10,0.55)";
      ctx.fillRect(wx, wy, 3 + rnd(i + 4) * 7, 2 + rnd(i + 5) * 6);
    }

    const bandY = h * (0.32 + rnd(99) * 0.28);
    const bandColor = VEGAS_NEON[Math.floor(rnd(100) * VEGAS_NEON.length)]!;
    ctx.fillStyle = bandColor;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, bandY, w, 7 + rnd(101) * 8);
    ctx.globalAlpha = 1;
    for (let d = 0; d < 14; d++) {
      ctx.fillStyle = rnd(d + 200) > 0.45 ? "#fff6e0" : "#ff2d8a";
      ctx.beginPath();
      ctx.arc(6 + d * (w / 15), bandY + 5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    const crown = ctx.createLinearGradient(0, 0, 0, h * 0.2);
    crown.addColorStop(0, "rgba(255,180,80,0.35)");
    crown.addColorStop(1, "rgba(255,60,160,0)");
    ctx.fillStyle = crown;
    ctx.fillRect(0, 0, w, h * 0.22);
  });
}

/** Night-club / strip tower siding — neon marquees, not a window checker grid. */
export function buildingFacadeTexture(seed: number): THREE.CanvasTexture {
  let tex = facadeCache.get(seed);
  if (!tex) {
    tex = vegasBuildingFacadeTexture(seed);
    facadeCache.set(seed, tex);
  }
  return tex;
}

/** Shared material cache — textures are expensive to regenerate. */
let asphaltCache: ReturnType<typeof asphaltTextures> | null = null;
let leatherCache: ReturnType<typeof leatherTextures> | null = null;

export function getAsphaltTextures() {
  asphaltCache ??= asphaltTextures();
  return asphaltCache;
}

export function getLeatherTextures() {
  leatherCache ??= leatherTextures();
  return leatherCache;
}

export function asphaltMaterial(): THREE.MeshPhysicalMaterial {
  const { map, roughnessMap, normalMap } = getAsphaltTextures();
  return new THREE.MeshPhysicalMaterial({
    map,
    roughnessMap,
    normalMap,
    normalScale: new THREE.Vector2(0.35, 0.35),
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.02,
    clearcoat: 0.08,
    clearcoatRoughness: 0.85,
  });
}

export function wetAsphaltMaterial(): THREE.MeshPhysicalMaterial {
  const mat = asphaltMaterial().clone();
  mat.roughness = 0.35;
  mat.metalness = 0.15;
  mat.clearcoat = 0.65;
  mat.clearcoatRoughness = 0.12;
  mat.color = new THREE.Color(0x8899aa);
  return mat;
}
