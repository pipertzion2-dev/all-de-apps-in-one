import * as THREE from "three";

/** Four-quadrant orthographic brand sheet (side / front / top / rear). */
export const BALOON8_BLUEPRINT_URL = "/assets/clean-sneaks/baloon8-orthographic-blueprint.jpg";

/** Alias — same orthographic sheet the runner and orbit viewer use. */
export const BALOON8_ORTHOGRAPHIC_BLUEPRINT_URL = BALOON8_BLUEPRINT_URL;

/** Official side-profile sneaker thumbnail (homepage / OG / fallbacks). */
export const BALOON8_SNEAKER_THUMBNAIL_URL = "/assets/clean-sneaks/baloon8-sneaker-thumbnail.png";

/** Polished side hero render — same asset as the sneaker thumbnail. */
export const BALOON8_HERO_REFERENCE_URL = "/assets/clean-sneaks/baloon8-sneaker-thumbnail.png";

export type Baloon8BlueprintQuadrant = "side" | "front" | "top" | "rear";

/** Image-space crop for each orthographic view — inset to drop labels / rulers. */
const QUADRANT_IMAGE_RECT: Record<
  Baloon8BlueprintQuadrant,
  { x: number; y: number; w: number; h: number }
> = {
  // Tighter insets: drop “SIDE/FRONT/TOP/REAR VIEW” captions under each panel
  side: { x: 0.03, y: 0.015, w: 0.44, h: 0.38 },
  front: { x: 0.53, y: 0.015, w: 0.42, h: 0.38 },
  top: { x: 0.03, y: 0.515, w: 0.44, h: 0.38 },
  rear: { x: 0.53, y: 0.515, w: 0.42, h: 0.38 },
};

/** UV crop for each panel (Three.js bottom-left origin, flipY textures). */
const QUADRANT_UV: Record<
  Baloon8BlueprintQuadrant,
  { offset: [number, number]; repeat: [number, number] }
> = {
  side: { offset: [0, 0.5], repeat: [0.5, 0.5] },
  front: { offset: [0.5, 0.5], repeat: [0.5, 0.5] },
  top: { offset: [0, 0], repeat: [0.5, 0.5] },
  rear: { offset: [0.5, 0], repeat: [0.5, 0.5] },
};

export type PreparedQuadrant = {
  map: THREE.CanvasTexture;
  alphaMap: THREE.CanvasTexture;
  /** Trimmed content width / height */
  aspect: number;
  trim: { u0: number; v0: number; u1: number; v1: number };
};

export type PreparedBlueprint = Record<Baloon8BlueprintQuadrant, PreparedQuadrant>;

function isBackgroundPixel(r: number, g: number, b: number): boolean {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum > 232 && r > 225 && g > 225 && b > 225;
}

function cropQuadrantCanvas(
  img: CanvasImageSource,
  quadrant: Baloon8BlueprintQuadrant,
): HTMLCanvasElement {
  const iw =
    "naturalWidth" in img && img.naturalWidth ? img.naturalWidth : (img as HTMLCanvasElement).width;
  const ih =
    "naturalHeight" in img && img.naturalHeight
      ? img.naturalHeight
      : (img as HTMLCanvasElement).height;
  const rect = QUADRANT_IMAGE_RECT[quadrant];
  const sx = Math.floor(rect.x * iw);
  const sy = Math.floor(rect.y * ih);
  const sw = Math.floor(rect.w * iw);
  const sh = Math.floor(rect.h * ih);
  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

function trimBounds(canvas: HTMLCanvasElement): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const ctx = canvas.getContext("2d")!;
  const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!isBackgroundPixel(data[i]!, data[i + 1]!, data[i + 2]!)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (minX > maxX) return { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };
  return { minX, minY, maxX, maxY };
}

/**
 * Keep only the widest contiguous column-run of opaque pixels so neighbor-panel
 * bleed (the “slit of a shoe” on each side) is discarded. For rear views, also
 * prefer the solid mid-body so hanging wheel lobes don’t read as side slits.
 */
function largestContentSpan(
  canvas: HTMLCanvasElement,
  opts?: { preferMidBody?: boolean },
): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const ctx = canvas.getContext("2d")!;
  const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const dens = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    let n = 0;
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4;
      if (!isBackgroundPixel(data[i]!, data[i + 1]!, data[i + 2]!)) n++;
    }
    dens[x] = n / height;
  }

  const thresh = 0.04;
  let bestStart = 0;
  let bestEnd = width - 1;
  let bestLen = 0;
  let runStart = -1;
  for (let x = 0; x <= width; x++) {
    const on = x < width && dens[x]! >= thresh;
    if (on && runStart < 0) runStart = x;
    if (!on && runStart >= 0) {
      const len = x - runStart;
      if (len > bestLen) {
        bestLen = len;
        bestStart = runStart;
        bestEnd = x - 1;
      }
      runStart = -1;
    }
  }

  // Tighten to the solid mid-body run (drop sparse wheel/mirror flanks).
  if (opts?.preferMidBody) {
    const midDens = new Float32Array(width);
    const y0 = Math.floor(height * 0.18);
    const y1 = Math.floor(height * 0.58);
    const midThresh = 0.45;
    for (let x = bestStart; x <= bestEnd; x++) {
      let n = 0;
      for (let y = y0; y < y1; y++) {
        const i = (y * width + x) * 4;
        if (!isBackgroundPixel(data[i]!, data[i + 1]!, data[i + 2]!)) n++;
      }
      midDens[x] = n / Math.max(1, y1 - y0);
    }
    let coreS = bestStart;
    let coreE = bestEnd;
    let coreLen = 0;
    let coreRun = -1;
    for (let x = bestStart; x <= bestEnd + 1; x++) {
      const on = x <= bestEnd && midDens[x]! >= midThresh;
      if (on && coreRun < 0) coreRun = x;
      if (!on && coreRun >= 0) {
        const len = x - coreRun;
        if (len > coreLen) {
          coreLen = len;
          coreS = coreRun;
          coreE = x - 1;
        }
        coreRun = -1;
      }
    }
    if (coreLen > (bestEnd - bestStart) * 0.35) {
      bestStart = coreS;
      bestEnd = coreE;
    }
  }

  // Largest contiguous vertical run inside the X span (drops caption fragments).
  const rowDens = new Float32Array(height);
  for (let y = 0; y < height; y++) {
    let n = 0;
    for (let x = bestStart; x <= bestEnd; x++) {
      const i = (y * width + x) * 4;
      if (!isBackgroundPixel(data[i]!, data[i + 1]!, data[i + 2]!)) n++;
    }
    rowDens[y] = n / Math.max(1, bestEnd - bestStart + 1);
  }
  const rowThresh = 0.02;
  let minY = 0;
  let maxY = height - 1;
  let rowLen = 0;
  let rowRun = -1;
  for (let y = 0; y <= height; y++) {
    const on = y < height && rowDens[y]! >= rowThresh;
    if (on && rowRun < 0) rowRun = y;
    if (!on && rowRun >= 0) {
      const len = y - rowRun;
      if (len > rowLen) {
        rowLen = len;
        minY = rowRun;
        maxY = y - 1;
      }
      rowRun = -1;
    }
  }
  if (rowLen === 0) return trimBounds(canvas);

  // Pad only into empty margins — never back into a discarded neighbor fragment.
  const pad = Math.max(2, Math.floor(width * 0.006));
  return {
    minX: Math.max(0, bestStart),
    maxX: Math.min(width - 1, bestEnd),
    minY: Math.max(0, minY - pad),
    maxY: Math.min(height - 1, maxY + pad),
  };
}

function buildAlphaMap(source: HTMLCanvasElement): HTMLCanvasElement {
  const alpha = document.createElement("canvas");
  alpha.width = source.width;
  alpha.height = source.height;
  const srcCtx = source.getContext("2d")!;
  const outCtx = alpha.getContext("2d")!;
  const { width, height, data } = srcCtx.getImageData(0, 0, source.width, source.height);
  const out = outCtx.createImageData(width, height);
  for (let i = 0; i < data.length; i += 4) {
    const opaque = isBackgroundPixel(data[i]!, data[i + 1]!, data[i + 2]!) ? 0 : 255;
    out.data[i] = 255;
    out.data[i + 1] = 255;
    out.data[i + 2] = 255;
    out.data[i + 3] = opaque;
  }
  outCtx.putImageData(out, 0, 0);
  return alpha;
}

function trimCanvas(
  source: HTMLCanvasElement,
  bounds: ReturnType<typeof trimBounds>,
): HTMLCanvasElement {
  const w = bounds.maxX - bounds.minX + 1;
  const h = bounds.maxY - bounds.minY + 1;
  const trimmed = document.createElement("canvas");
  trimmed.width = w;
  trimmed.height = h;
  trimmed.getContext("2d")!.drawImage(source, bounds.minX, bounds.minY, w, h, 0, 0, w, h);
  return trimmed;
}

function canvasTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** Cut white background, trim to shoe silhouette, build map + alphaMap per orthographic view. */
export function prepareBlueprintQuadrant(
  img: CanvasImageSource,
  quadrant: Baloon8BlueprintQuadrant,
): PreparedQuadrant {
  const raw = cropQuadrantCanvas(img, quadrant);
  const bounds = largestContentSpan(raw, { preferMidBody: quadrant === "rear" });
  const trimmed = trimCanvas(raw, bounds);
  const map = canvasTexture(trimmed);
  const alphaMap = canvasTexture(buildAlphaMap(trimmed));
  const trim = {
    u0: bounds.minX / raw.width,
    v0: bounds.minY / raw.height,
    u1: (bounds.maxX + 1) / raw.width,
    v1: (bounds.maxY + 1) / raw.height,
  };
  return { map, alphaMap, aspect: trimmed.width / trimmed.height, trim };
}

let preparedCache: WeakMap<CanvasImageSource, PreparedBlueprint> = new WeakMap();

export function prepareBlueprint(blueprint: THREE.Texture): PreparedBlueprint {
  const img = blueprint.image as CanvasImageSource;
  const cached = preparedCache.get(img);
  if (cached) return cached;

  const prepared = {
    side: prepareBlueprintQuadrant(img, "side"),
    front: prepareBlueprintQuadrant(img, "front"),
    top: prepareBlueprintQuadrant(img, "top"),
    rear: prepareBlueprintQuadrant(img, "rear"),
  } satisfies PreparedBlueprint;
  preparedCache.set(img, prepared);
  return prepared;
}

export function cropBlueprintTexture(
  source: THREE.Texture,
  quadrant: Baloon8BlueprintQuadrant,
): THREE.Texture {
  const tex = source.clone();
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  const uv = QUADRANT_UV[quadrant];
  tex.offset.set(uv.offset[0], uv.offset[1]);
  tex.repeat.set(uv.repeat[0], uv.repeat[1]);
  tex.needsUpdate = true;
  return tex;
}

let heroReferenceLoad: Promise<THREE.Texture> | null = null;

export function loadBaloon8HeroReferenceTexture(): Promise<THREE.Texture> {
  if (!heroReferenceLoad) {
    heroReferenceLoad = new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        BALOON8_HERO_REFERENCE_URL,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 8;
          resolve(tex);
        },
        undefined,
        reject,
      );
    });
  }
  return heroReferenceLoad;
}

let blueprintLoad: Promise<THREE.Texture> | null = null;

function proceduralBlueprintTexture(): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const quadrants: Array<{ x: number; y: number; label: string; fill: string }> = [
    { x: 0, y: 0, label: "TOP", fill: "#2a6080" },
    { x: 512, y: 0, label: "REAR", fill: "#1a4030" },
    { x: 0, y: 512, label: "SIDE", fill: "#3a7898" },
    { x: 512, y: 512, label: "FRONT", fill: "#0a4028" },
  ];
  for (const q of quadrants) {
    ctx.fillStyle = q.fill;
    ctx.fillRect(q.x, q.y, 512, 512);
    ctx.fillStyle = "#7ec8d9";
    ctx.font = "bold 48px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(q.label, q.x + 256, q.y + 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

const BLUEPRINT_LOAD_TIMEOUT_MS = 8000;

function blueprintLoadTimeout(): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      console.warn("[Baloon8] blueprint JPG timed out, using procedural panels");
      resolve(proceduralBlueprintTexture());
    }, BLUEPRINT_LOAD_TIMEOUT_MS);
  });
}

export function loadBaloon8BlueprintTexture(): Promise<THREE.Texture> {
  if (!blueprintLoad) {
    blueprintLoad = Promise.race([
      new Promise<THREE.Texture>((resolve) => {
        new THREE.TextureLoader().load(
          BALOON8_BLUEPRINT_URL,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = 8;
            resolve(tex);
          },
          undefined,
          (err) => {
            console.warn("[Baloon8] blueprint JPG failed, using procedural panels", err);
            resolve(proceduralBlueprintTexture());
          },
        );
      }),
      typeof window !== "undefined"
        ? blueprintLoadTimeout()
        : new Promise<THREE.Texture>((resolve) => resolve(proceduralBlueprintTexture())),
    ]);
  }
  return blueprintLoad;
}

/**
 * Drop sparse right-side dimension callouts (mm / in rulers) that hang off the
 * studio sneaker render — keep only the dense shoe body for in-game billboards.
 */
function cropAnnotationStrip(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d")!;
  const { width, height, data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const density = new Float32Array(width);
  for (let x = 0; x < width; x++) {
    let n = 0;
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4;
      if (!isBackgroundPixel(data[i]!, data[i + 1]!, data[i + 2]!)) n++;
    }
    density[x] = n / height;
  }

  let shoeEnd = width - 1;
  const start = Math.floor(width * 0.55);
  for (let x = start; x < width - 4; x++) {
    let sum = 0;
    for (let k = 0; k < 8; k++) sum += density[Math.min(width - 1, x + k)]!;
    if (sum / 8 < 0.08) {
      shoeEnd = x;
      break;
    }
  }

  if (shoeEnd >= width - 2) return canvas;
  const cropped = document.createElement("canvas");
  cropped.width = shoeEnd;
  cropped.height = height;
  cropped.getContext("2d")!.drawImage(canvas, 0, 0, shoeEnd, height, 0, 0, shoeEnd, height);
  return cropped;
}

/** Cut white studio backdrop (+ dimension rulers) from the official sneaker thumbnail. */
export function prepareSneakerThumbnail(img: CanvasImageSource): PreparedQuadrant {
  const iw =
    "naturalWidth" in img && img.naturalWidth ? img.naturalWidth : (img as HTMLCanvasElement).width;
  const ih =
    "naturalHeight" in img && img.naturalHeight
      ? img.naturalHeight
      : (img as HTMLCanvasElement).height;
  const canvas = document.createElement("canvas");
  canvas.width = iw;
  canvas.height = ih;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  const withoutRulers = cropAnnotationStrip(canvas);
  const bounds = trimBounds(withoutRulers);
  const trimmed = trimCanvas(withoutRulers, bounds);
  const map = canvasTexture(trimmed);
  const alphaMap = canvasTexture(buildAlphaMap(trimmed));
  return {
    map,
    alphaMap,
    aspect: trimmed.width / trimmed.height,
    trim: {
      u0: bounds.minX / iw,
      v0: bounds.minY / ih,
      u1: (bounds.maxX + 1) / iw,
      v1: (bounds.maxY + 1) / ih,
    },
  };
}

/** Canvas sprite — official Baloon8 sneaker side thumbnail (fallback: blueprint crop). */
let sideSpriteLoad: Promise<HTMLCanvasElement> | null = null;

export function loadBaloon8SideSprite(): Promise<HTMLCanvasElement> {
  if (!sideSpriteLoad) {
    sideSpriteLoad = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("2d context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = () => {
        loadBaloon8BlueprintTexture()
          .then((tex) => {
            const prep = prepareBlueprintQuadrant(tex.image as CanvasImageSource, "side");
            const canvas = document.createElement("canvas");
            canvas.width = prep.map.image.width;
            canvas.height = prep.map.image.height;
            canvas.getContext("2d")!.drawImage(prep.map.image as CanvasImageSource, 0, 0);
            resolve(canvas);
          })
          .catch(reject);
      };
      img.src = BALOON8_SNEAKER_THUMBNAIL_URL;
    });
  }
  return sideSpriteLoad;
}
