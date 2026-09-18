"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STIEHL_LOGO_CUBE_URL } from "@/lib/clean-sneaks/assets";
import {
  journeyFaceFromMaterialIndex,
  rotationForJourneyFace,
  type HomepageJourneyFace,
} from "@/lib/homepage-cube-journey";

type Props = {
  activeFace: HomepageJourneyFace;
  /** When true, the begin face uses the tri-corner view (all three sides visible). */
  preferCornerOnBegin?: boolean;
  mount?: boolean;
  onFaceSelect?: (face: HomepageJourneyFace) => void;
};

const BLANK_FACE_COLOR = 0x080a0e;
const ZC_FONT = '"Zc", sans-serif';

type FacePaint = {
  title: string;
  subtitle: string;
  accent: string;
  image?: HTMLImageElement;
};

function paintJourneyFace({ title, subtitle, accent, image }: FacePaint): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.fillStyle = "#0a0e14";
  ctx.fillRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(size * 0.5, size * 0.42, 40, size * 0.5, size * 0.42, size * 0.62);
  glow.addColorStop(0, accent + "55");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  if (image) {
    ctx.save();
    ctx.globalAlpha = 0.92;
    const scale = Math.max(size / image.width, size / image.height) * 0.78;
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.drawImage(image, (size - w) / 2, (size - h) / 2 + 40, w, h);
    ctx.restore();
  }

  const veil = ctx.createLinearGradient(0, 0, 0, size * 0.34);
  veil.addColorStop(0, "rgba(0,0,0,0.82)");
  veil.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, size, size * 0.34);

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `bold 132px ${ZC_FONT}`;
  ctx.lineWidth = 14;
  ctx.strokeStyle = "rgba(0,0,0,0.9)";
  ctx.fillStyle = "#ffffff";
  ctx.strokeText(title, size / 2, size * 0.06);
  ctx.fillText(title, size / 2, size * 0.06);

  ctx.font = `34px ${ZC_FONT}`;
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillText(subtitle, size / 2, size * 0.86);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function blankFaceMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: BLANK_FACE_COLOR,
    metalness: 0.35,
    roughness: 0.72,
    transparent: true,
    opacity: 0.55,
  });
}

export function JourneyCubeCanvas({
  activeFace,
  preferCornerOnBegin = true,
  mount = true,
  onFaceSelect,
}: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeFaceRef = useRef(activeFace);
  const preferCornerRef = useRef(preferCornerOnBegin);
  const onSelectRef = useRef(onFaceSelect);

  useEffect(() => {
    activeFaceRef.current = activeFace;
  }, [activeFace]);
  useEffect(() => {
    preferCornerRef.current = preferCornerOnBegin;
  }, [preferCornerOnBegin]);
  useEffect(() => {
    onSelectRef.current = onFaceSelect;
  }, [onFaceSelect]);

  useEffect(() => {
    if (!mount) return;
    const el = mountRef.current;
    if (!el) return;

    let cancelled = false;
    const cW = el.clientWidth || 420;
    const cH = el.clientHeight || 420;
    const SCALE = 1.75;
    const W = Math.round(cW * SCALE);
    const H = Math.round(cH * SCALE);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: `${W}px`,
      height: `${H}px`,
      pointerEvents: "auto",
      touchAction: "none",
      cursor: "grab",
    });
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0.15, 5.8);

    scene.add(new THREE.AmbientLight(0xffffff, 1.65));
    const key = new THREE.DirectionalLight(0xd8e8ff, 0.55);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0xffffff, 2.4, 18);
    rim.position.set(-3, 2, 4);
    scene.add(rim);

    const materials: THREE.MeshStandardMaterial[] = [
      blankFaceMaterial(), // +x game placeholder
      blankFaceMaterial(), // -x
      blankFaceMaterial(), // +y home placeholder
      blankFaceMaterial(), // -y
      blankFaceMaterial(), // +z begin placeholder
      blankFaceMaterial(), // -z
    ];

    const assignFace = (index: number, paint: FacePaint) => {
      const mat = materials[index];
      const labeled = paintJourneyFace(paint);
      mat.map = labeled;
      mat.emissiveMap = labeled;
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveIntensity = 0.42;
      mat.metalness = 0.22;
      mat.roughness = 0.28;
      mat.opacity = 0.96;
      mat.transparent = true;
      mat.needsUpdate = true;
    };

    assignFace(4, {
      title: "BEGIN",
      subtitle: "Six products · one cube",
      accent: "#5B8DA8",
    });
    assignFace(2, {
      title: "HOME",
      subtitle: "Explore zzai zzai",
      accent: "#D94F9C",
    });

    new THREE.TextureLoader().load(
      STIEHL_LOGO_CUBE_URL,
      (tex) => {
        if (cancelled) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        const img = tex.image as HTMLImageElement | undefined;
        assignFace(0, {
          title: "PLAY",
          subtitle: "Klean Sneaks · tap to open",
          accent: "#A8BA48",
          image: img,
        });
        tex.dispose();
      },
      undefined,
      () => {
        if (cancelled) return;
        assignFace(0, {
          title: "PLAY",
          subtitle: "Klean Sneaks · tap to open",
          accent: "#A8BA48",
        });
      },
    );

    const box = new THREE.Mesh(new THREE.BoxGeometry(2.05, 2.05, 2.05), materials);
    scene.add(box);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.08, 2.08, 2.08)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.38 }),
    );
    scene.add(edges);

    let targetX = rotationForJourneyFace("begin", true).x;
    let targetY = rotationForJourneyFace("begin", true).y;
    let isDragging = false;
    let pointerMoved = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;

    const syncTarget = () => {
      const rot = rotationForJourneyFace(activeFaceRef.current, preferCornerRef.current);
      targetX = rot.x;
      targetY = rot.y;
    };
    syncTarget();

    const cv = renderer.domElement;

    const onDown = (e: PointerEvent) => {
      isDragging = true;
      pointerMoved = false;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = velY = 0;
      cv.setPointerCapture(e.pointerId);
      cv.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pointerMoved = true;
      velX = dx * 0.012;
      velY = dy * 0.012;
      targetY += dx * 0.008;
      targetX += dy * 0.008;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      isDragging = false;
      cv.style.cursor = "grab";
      if (pointerMoved) {
        syncTarget();
        return;
      }
      const rect = cv.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObject(box);
      if (hits.length > 0) {
        const face = journeyFaceFromMaterialIndex(hits[0].face?.materialIndex);
        if (face) onSelectRef.current?.(face);
      }
    };

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);

      if (!isDragging) {
        velX *= 0.9;
        velY *= 0.9;
        if (Math.abs(velX) < 0.001 && Math.abs(velY) < 0.001) {
          syncTarget();
        } else {
          targetY += velX;
          targetX += velY;
        }
      }

      box.rotation.x += (targetX - box.rotation.x) * 0.085;
      box.rotation.y += (targetY - box.rotation.y) * 0.085;
      edges.rotation.copy(box.rotation);

      const t = Date.now() * 0.00055;
      rim.position.set(Math.cos(t) * 3.5, Math.sin(t * 0.8) * 2.5, Math.sin(t) * 2 + 4);

      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const w = Math.round(el.clientWidth * SCALE);
      const h = Math.round(el.clientHeight * SCALE);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      Object.assign(renderer.domElement.style, { width: `${w}px`, height: `${h}px` });
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      materials.forEach((m) => {
        m.map?.dispose();
        m.emissiveMap?.dispose();
        m.dispose();
      });
      renderer.dispose();
      cv.remove();
    };
  }, [mount]);

  useEffect(() => {
    if (!mount) return;
    // Target rotation updates when active face changes — canvas reads refs each frame.
  }, [activeFace, preferCornerOnBegin, mount]);

  return (
    <div
      ref={mountRef}
      className="h-full w-full overflow-visible"
      aria-hidden={!mount}
      data-testid="homepage-journey-cube"
    />
  );
}
