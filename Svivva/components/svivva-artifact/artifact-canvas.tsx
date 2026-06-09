"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import type { FeatureDef, FeatureId } from "./feature-defs";
import { FEATURES } from "./feature-defs";

type Props = {
  active: FeatureId;
  onSelect: (id: FeatureId) => void;
};

export function ArtifactCanvas({ active, onSelect }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    cube: THREE.Group;
    textures: THREE.Texture[];
    faces: THREE.Mesh[];
    rafId: number;
    isDragging: boolean;
    lastX: number;
    lastY: number;
    velX: number;
    velY: number;
    targetRotX: number;
    targetRotY: number;
  } | null>(null);

  // Map feature index → cube face
  // Box geometry face order: +x, -x, +y, -y, +z, -z
  const featureOrder: FeatureId[] = ["api", "security", "play", "hardware", "seeds", "orbit"];

  const initScene = useCallback(() => {
    const el = mountRef.current;
    if (!el) return;

    const W = el.clientWidth || 400;
    const H = el.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 100);
    camera.position.set(0, 0, 4.2);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8888ff, 0.4);
    fill.position.set(-3, -2, -2);
    scene.add(fill);

    const loader = new THREE.TextureLoader();
    const textures: THREE.Texture[] = [];
    const faces: THREE.Mesh[] = [];
    const cube = new THREE.Group();

    // Face configs: position offset + rotation to face outward
    const faceConfigs = [
      { pos: [1, 0, 0], rot: [0, -Math.PI / 2, 0] }, // +x
      { pos: [-1, 0, 0], rot: [0, Math.PI / 2, 0] }, // -x
      { pos: [0, 1, 0], rot: [Math.PI / 2, 0, 0] }, // +y
      { pos: [0, -1, 0], rot: [-Math.PI / 2, 0, 0] }, // -y
      { pos: [0, 0, 1], rot: [0, 0, 0] }, // +z
      { pos: [0, 0, -1], rot: [0, Math.PI, 0] }, // -z
    ];

    featureOrder.forEach((fId, i) => {
      const feature = FEATURES.find((f) => f.id === fId)!;
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.15,
        roughness: 0.55,
        transparent: true,
        opacity: 0,
      });

      loader.load(feature.artworkSrc, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        mat.map = tex;
        mat.needsUpdate = true;
        textures[i] = tex;
      });

      const geo = new THREE.PlaneGeometry(1.92, 1.92);
      const mesh = new THREE.Mesh(geo, mat);
      const cfg = faceConfigs[i];
      mesh.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      mesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      (mesh as unknown as THREE.Mesh & { featureId: FeatureId }).featureId = fId;
      faces.push(mesh);
      cube.add(mesh);

      // Border frame
      const frameGeo = new THREE.PlaneGeometry(1.98, 1.98);
      const frameMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(feature.accentColor),
        transparent: true,
        opacity: 0,
        side: THREE.FrontSide,
        wireframe: false,
      });
      const borderMesh = new THREE.Mesh(frameGeo, frameMat);
      borderMesh.position.set(cfg.pos[0] * 1.001, cfg.pos[1] * 1.001, cfg.pos[2] * 1.001);
      borderMesh.rotation.set(cfg.rot[0], cfg.rot[1], cfg.rot[2]);
      borderMesh.renderOrder = -1;
      cube.add(borderMesh);
    });

    // Edges wireframe
    const edgesGeo = new THREE.BoxGeometry(2.02, 2.02, 2.02);
    const edges = new THREE.EdgesGeometry(edgesGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
    });
    cube.add(new THREE.LineSegments(edges, edgesMat));

    scene.add(cube);

    // Fade in panels
    let fadeT = 0;
    const fadeDuration = 60;

    // Momentum rotation state
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotX = -0.3;
    let targetRotY = 0.4;

    const state = {
      renderer,
      scene,
      camera,
      cube,
      textures,
      faces,
      rafId: 0,
      isDragging,
      lastX,
      lastY,
      velX,
      velY,
      targetRotX,
      targetRotY,
    };
    sceneRef.current = state;

    // Pointer events
    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
      state.velX = 0;
      state.velY = 0;
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!state.isDragging) return;
      const dx = e.clientX - state.lastX;
      const dy = e.clientY - state.lastY;
      state.velX = dx * 0.012;
      state.velY = dy * 0.012;
      state.targetRotY += dx * 0.008;
      state.targetRotX += dy * 0.008;
      state.lastX = e.clientX;
      state.lastY = e.clientY;
    };
    const onPointerUp = () => {
      state.isDragging = false;
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.style.cursor = "grab";

    // Click detection for face selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerMoved = false;
    renderer.domElement.addEventListener("pointerdown", () => {
      pointerMoved = false;
    });
    renderer.domElement.addEventListener("pointermove", () => {
      pointerMoved = true;
    });
    renderer.domElement.addEventListener("pointerup", (e) => {
      if (pointerMoved) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(faces);
      if (hits.length > 0) {
        const fid = (hits[0].object as unknown as THREE.Mesh & { featureId: FeatureId }).featureId;
        if (fid) onSelect(fid);
      }
    });

    const animate = () => {
      state.rafId = requestAnimationFrame(animate);

      // Fade panels in
      if (fadeT < fadeDuration) {
        fadeT++;
        const prog = fadeT / fadeDuration;
        faces.forEach((f) => {
          ((f as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = prog;
        });
      }

      // Momentum decay
      if (!state.isDragging) {
        state.velX *= 0.92;
        state.velY *= 0.92;
        state.targetRotY += state.velX;
        state.targetRotX += state.velY;
        // Gentle auto-rotation when velocity is low
        if (Math.abs(state.velX) < 0.001 && Math.abs(state.velY) < 0.001) {
          state.targetRotY += 0.003;
        }
      }

      cube.rotation.y += (state.targetRotY - cube.rotation.y) * 0.08;
      cube.rotation.x += (state.targetRotX - cube.rotation.x) * 0.08;

      // Highlight active face
      const activeIdx = featureOrder.indexOf(active);
      faces.forEach((f, i) => {
        const mat = f.material as THREE.MeshStandardMaterial;
        const target = i === activeIdx ? 1.0 : 0.82;
        mat.opacity += (target - mat.opacity) * 0.1;
      });

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(state.rafId);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [active, onSelect]);

  useEffect(() => {
    const cleanup = initScene();
    return cleanup;
  }, []);

  return <div ref={mountRef} className="w-full h-full" style={{ cursor: "grab" }} />;
}
