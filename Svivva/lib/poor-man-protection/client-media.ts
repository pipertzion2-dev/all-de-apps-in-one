/**
 * Browser-only helpers shared by Poor Man Protection and Klean reference remix.
 * Keep heavy canvas work off the server.
 */

import type { ColorSwatch } from "./types";

export async function sha256Hex(buffer: BufferSource): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Text(text: string): Promise<string> {
  return sha256Hex(new TextEncoder().encode(text));
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
}

/** Quantize an image file into role-tagged palette swatches. */
export async function extractPalette(file: File): Promise<ColorSwatch[]> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [{ hex: "#5B8DA8", role: "dominant", weight: 1 }];
  ctx.drawImage(bitmap, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const key = `${data[i] >> 4},${data[i + 1] >> 4},${data[i + 2] >> 4}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const sorted = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([key, count]) => {
      const [rq, gq, bq] = key.split(",").map(Number);
      return { hex: rgbToHex(rq * 17, gq * 17, bq * 17), count };
    });
  const total = sorted.reduce((s, x) => s + x.count, 0) || 1;
  const roles: ColorSwatch["role"][] = ["dominant", "secondary", "accent", "shadow", "highlight"];
  return sorted.map((s, i) => ({
    hex: s.hex,
    role: roles[i] || "accent",
    weight: Number((s.count / total).toFixed(3)),
  }));
}

/** Downscale for protect API imageBase64 (size-capped). */
export async function fileToDownscaledBase64(
  file: File,
  maxEdge = 768,
): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const comma = dataUrl.indexOf(",");
    return comma >= 0 ? dataUrl.slice(comma + 1) : undefined;
  } catch {
    return undefined;
  }
}

export function isImageReferenceFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(file.name);
}

export function isVideoReferenceFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogv)$/i.test(file.name);
}

export function isMediaReferenceFile(file: File): boolean {
  return isImageReferenceFile(file) || isVideoReferenceFile(file);
}

type VideoSampleHandle = { video: HTMLVideoElement; revoke: () => void };

function loadVideoElement(file: File): Promise<VideoSampleHandle> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    const revoke = () => URL.revokeObjectURL(url);
    video.onloadeddata = () => resolve({ video, revoke });
    video.onerror = () => {
      revoke();
      reject(new Error("Could not read video reference"));
    };
  });
}

async function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  if (!Number.isFinite(video.duration) || video.duration <= 0) return;
  const t = Math.min(Math.max(0, time), Math.max(0, video.duration - 0.05));
  if (Math.abs(video.currentTime - t) < 0.02) return;
  await new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Video seek failed"));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = t;
  });
}

/** Sample several frames from a video and merge into one role palette. */
export async function extractPaletteFromVideo(file: File, frameCount = 5): Promise<ColorSwatch[]> {
  const { video, revoke } = await loadVideoElement(file);
  try {
    const canvas = document.createElement("canvas");
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [{ hex: "#5B8DA8", role: "dominant", weight: 1 }];

    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    const merged = new Map<string, number>();
    for (let i = 0; i < frameCount; i++) {
      const t = duration * ((i + 0.5) / frameCount);
      await seekVideo(video, t);
      ctx.drawImage(video, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      for (let p = 0; p < data.length; p += 4) {
        if (data[p + 3]! < 200) continue;
        const key = `${data[p]! >> 4},${data[p + 1]! >> 4},${data[p + 2]! >> 4}`;
        merged.set(key, (merged.get(key) || 0) + 1);
      }
    }
    const sorted = [...merged.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => {
        const [rq, gq, bq] = key.split(",").map(Number);
        return { hex: rgbToHex(rq! * 17, gq! * 17, bq! * 17), count };
      });
    const total = sorted.reduce((s, x) => s + x.count, 0) || 1;
    const roles: ColorSwatch["role"][] = ["dominant", "secondary", "accent", "shadow", "highlight"];
    if (sorted.length === 0) return [{ hex: "#5B8DA8", role: "dominant", weight: 1 }];
    return sorted.map((s, i) => ({
      hex: s.hex,
      role: roles[i] || "accent",
      weight: Number((s.count / total).toFixed(3)),
    }));
  } finally {
    video.removeAttribute("src");
    video.load();
    revoke();
  }
}

/** Grab a still JPEG from mid-video for seal / preview thumbnails. */
export async function videoToStillBase64(file: File, maxEdge = 768): Promise<string | undefined> {
  const { video, revoke } = await loadVideoElement(file);
  try {
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
    await seekVideo(video, duration * 0.35);
    const scale = Math.min(1, maxEdge / Math.max(video.videoWidth || 1, video.videoHeight || 1));
    const w = Math.max(1, Math.round((video.videoWidth || 640) * scale));
    const h = Math.max(1, Math.round((video.videoHeight || 360) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
    const comma = dataUrl.indexOf(",");
    return comma >= 0 ? dataUrl.slice(comma + 1) : undefined;
  } finally {
    video.removeAttribute("src");
    video.load();
    revoke();
  }
}

/** Image or video → palette + optional still for sealing. */
export async function sampleMediaReference(file: File): Promise<{
  palette: ColorSwatch[];
  imageBase64?: string;
  mimeType: string;
  kind: "image" | "video";
}> {
  if (isVideoReferenceFile(file)) {
    const [palette, imageBase64] = await Promise.all([
      extractPaletteFromVideo(file),
      videoToStillBase64(file),
    ]);
    return {
      palette,
      imageBase64,
      mimeType: "image/jpeg",
      kind: "video",
    };
  }
  if (!isImageReferenceFile(file)) {
    throw new Error("Use an image or video reference");
  }
  const [palette, imageBase64] = await Promise.all([
    extractPalette(file),
    fileToDownscaledBase64(file),
  ]);
  return {
    palette,
    imageBase64,
    mimeType: file.type || "image/png",
    kind: "image",
  };
}
