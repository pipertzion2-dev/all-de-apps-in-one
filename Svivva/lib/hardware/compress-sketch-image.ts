/** Max base64 length we send in JSON — keeps payload under server body limits with headroom. */
export const SKETCH_UPLOAD_MAX_BASE64_BYTES = 700_000;

/** Longest edge after resize — enough detail for vision analysis on mobile photos. */
export const SKETCH_IMAGE_MAX_EDGE = 1600;

export type CompressedSketchImage = {
  base64: string;
  mimeType: "image/jpeg";
  dataUrl: string;
};

export function computeScaledDimensions(
  width: number,
  height: number,
  maxEdge: number = SKETCH_IMAGE_MAX_EDGE,
): { width: number; height: number } {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function encodeJpeg(canvas: HTMLCanvasElement, quality: number): string {
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  if (!base64) throw new Error("Could not encode image");
  return base64;
}

function drawToCanvas(bitmap: ImageBitmap, maxEdge: number): HTMLCanvasElement {
  const { width, height } = computeScaledDimensions(bitmap.width, bitmap.height, maxEdge);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

/**
 * Downscale and re-encode a sketch photo so mobile camera uploads stay under API body limits.
 * Runs in the browser only (uses canvas + createImageBitmap).
 */
export async function compressSketchImageFile(
  file: File,
  maxBase64Bytes: number = SKETCH_UPLOAD_MAX_BASE64_BYTES,
): Promise<CompressedSketchImage> {
  const bitmap = await createImageBitmap(file);
  try {
    const edgeSteps = [SKETCH_IMAGE_MAX_EDGE, 1200, 960, 768];
    for (const maxEdge of edgeSteps) {
      const canvas = drawToCanvas(bitmap, maxEdge);
      for (let quality = 0.88; quality >= 0.45; quality -= 0.08) {
        const base64 = encodeJpeg(canvas, quality);
        if (base64.length <= maxBase64Bytes) {
          const mimeType = "image/jpeg" as const;
          return {
            base64,
            mimeType,
            dataUrl: `data:${mimeType};base64,${base64}`,
          };
        }
      }
    }

    const canvas = drawToCanvas(bitmap, 640);
    const base64 = encodeJpeg(canvas, 0.45);
    const mimeType = "image/jpeg" as const;
    return {
      base64,
      mimeType,
      dataUrl: `data:${mimeType};base64,${base64}`,
    };
  } finally {
    bitmap.close();
  }
}
