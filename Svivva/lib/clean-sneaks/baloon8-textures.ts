import * as THREE from "three";

/** Four-quadrant layout of baloon8-blueprint.jpg (2×2 orthographic sheet). */
export const BALOON8_BLUEPRINT_URL = "/assets/clean-sneaks/baloon8-blueprint.jpg";

export type Baloon8BlueprintQuadrant = "side" | "front" | "top" | "rear";

/** UV crop for each panel on the 2×2 blueprint sheet (Three.js bottom-left origin). */
const QUADRANT_UV: Record<
  Baloon8BlueprintQuadrant,
  { offset: [number, number]; repeat: [number, number] }
> = {
  side: { offset: [0, 0.5], repeat: [0.5, 0.5] },
  front: { offset: [0.5, 0.5], repeat: [0.5, 0.5] },
  top: { offset: [0, 0], repeat: [0.5, 0.5] },
  rear: { offset: [0.5, 0], repeat: [0.5, 0.5] },
};

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

let blueprintLoad: Promise<THREE.Texture> | null = null;

export function loadBaloon8BlueprintTexture(): Promise<THREE.Texture> {
  if (!blueprintLoad) {
    blueprintLoad = new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        BALOON8_BLUEPRINT_URL,
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
  return blueprintLoad;
}

/** Canvas sprite — side profile from the user's Baloon8 mockup (top-left quadrant). */
let sideSpriteLoad: Promise<HTMLCanvasElement> | null = null;

export function loadBaloon8SideSprite(): Promise<HTMLCanvasElement> {
  if (!sideSpriteLoad) {
    sideSpriteLoad = new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.onload = () => {
        const sw = Math.floor(img.width * 0.5);
        const sh = Math.floor(img.height * 0.5);
        const canvas = document.createElement("canvas");
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, sw, sh, 0, 0, sw, sh);
        resolve(canvas);
      };
      img.onerror = () => reject(new Error("Baloon8 blueprint failed to load"));
      img.src = BALOON8_BLUEPRINT_URL;
    });
  }
  return sideSpriteLoad;
}
