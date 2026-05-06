"use client";

import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

interface CadModelViewerProps {
  productName: string;
  productCategory: string;
  materials: string[];
  requirements: string[];
  className?: string;
}

function getMaterialColor(materials: string[]): number {
  if (materials.includes("Titanium")) return 0x8899aa;
  if (materials.includes("Carbon fiber")) return 0x333333;
  if (materials.includes("Aluminum")) return 0xb0b8c0;
  if (materials.includes("Steel")) return 0x7a8088;
  if (materials.includes("Wood")) return 0x8b6914;
  if (materials.includes("Glass")) return 0x88ccee;
  if (materials.includes("Silicone")) return 0x99aacc;
  if (materials.includes("Plastic (ABS)")) return 0xe8e8e8;
  return 0xaaaaaa;
}

function getAccentColor(materials: string[]): number {
  if (materials.includes("Carbon fiber")) return 0x5BA8A0;
  if (materials.includes("Titanium")) return 0x6B2C4A;
  if (materials.includes("Glass")) return 0x5BA8A0;
  return 0xA05068;
}

function buildProductGeometry(
  category: string,
  requirements: string[],
  scene: THREE.Scene,
  matColor: number,
  accentColor: number
): THREE.Group {
  const group = new THREE.Group();
  const mainMat = new THREE.MeshPhysicalMaterial({
    color: matColor,
    metalness: 0.6,
    roughness: 0.3,
    clearcoat: 0.4,
    clearcoatRoughness: 0.2,
  });
  const accentMat = new THREE.MeshPhysicalMaterial({
    color: accentColor,
    metalness: 0.4,
    roughness: 0.4,
    clearcoat: 0.3,
  });
  const darkMat = new THREE.MeshPhysicalMaterial({
    color: 0x222222,
    metalness: 0.8,
    roughness: 0.2,
  });

  const cat = category.toLowerCase();
  const isCompact = requirements.includes("Compact size");
  const isModular = requirements.includes("Modular design");
  const scale = isCompact ? 0.7 : 1.0;

  if (cat.includes("electron") || cat.includes("device") || cat.includes("gadget") || cat.includes("phone") || cat.includes("tablet")) {
    const bodyW = 1.2 * scale;
    const bodyH = 0.15 * scale;
    const bodyD = 2.0 * scale;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyD), mainMat);
    body.geometry = roundEdges(body.geometry, 0.05);
    group.add(body);

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(bodyW * 0.85, bodyD * 0.88),
      new THREE.MeshPhysicalMaterial({ color: 0x111111, metalness: 0.1, roughness: 0.05, clearcoat: 1.0 })
    );
    screen.position.set(0, bodyH / 2 + 0.001, -bodyD * 0.02);
    screen.rotation.x = -Math.PI / 2;
    group.add(screen);

    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 16), accentMat);
    btn.position.set(bodyW / 2 + 0.001, 0, 0);
    btn.rotation.z = Math.PI / 2;
    group.add(btn);

    const port = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.06), darkMat);
    port.position.set(0, -bodyH / 2, bodyD / 2 + 0.001);
    group.add(port);

    if (isModular) {
      for (let i = -1; i <= 1; i += 2) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.04, bodyH * 1.1, bodyD * 0.3), accentMat);
        rail.position.set(i * (bodyW / 2 + 0.025), 0, -bodyD * 0.25);
        group.add(rail);
      }
    }
  } else if (cat.includes("home") || cat.includes("appliance") || cat.includes("kitchen")) {
    const baseR = 0.6 * scale;
    const baseH = 1.4 * scale;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(baseR, baseR * 1.05, baseH, 32), mainMat);
    group.add(base);

    const lid = new THREE.Mesh(new THREE.CylinderGeometry(baseR * 0.3, baseR, 0.3 * scale, 32), mainMat);
    lid.position.y = baseH / 2 + 0.15 * scale;
    group.add(lid);

    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.08 * scale, 16, 16), accentMat);
    knob.position.y = baseH / 2 + 0.35 * scale;
    group.add(knob);

    const panel = new THREE.Mesh(new THREE.BoxGeometry(baseR * 0.6, baseH * 0.2, 0.02), darkMat);
    panel.position.set(0, -baseH * 0.1, baseR + 0.01);
    group.add(panel);
  } else if (cat.includes("industrial") || cat.includes("tool") || cat.includes("machine") || cat.includes("equipment")) {
    const baseW = 1.8 * scale;
    const baseH = 0.3 * scale;
    const baseD = 1.2 * scale;
    const base = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), mainMat);
    group.add(base);

    const col = new THREE.Mesh(new THREE.BoxGeometry(0.25 * scale, 1.5 * scale, 0.25 * scale), mainMat);
    col.position.set(-baseW * 0.35, 0.9 * scale, 0);
    group.add(col);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.0 * scale, 0.15 * scale, 0.2 * scale), accentMat);
    arm.position.set(0, 1.65 * scale, 0);
    group.add(arm);

    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * scale, 0.08 * scale, 0.4 * scale, 16), darkMat);
    head.position.set(0.35 * scale, 1.4 * scale, 0);
    group.add(head);

    for (let i = -1; i <= 1; i += 2) {
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, baseD * 0.3), darkMat);
      foot.position.set(i * baseW * 0.4, -baseH / 2 - 0.04, 0);
      group.add(foot);
    }
  } else if (cat.includes("wear") || cat.includes("watch") || cat.includes("fitness") || cat.includes("health")) {
    const bandW = 0.4 * scale;
    const faceR = 0.35 * scale;

    const face = new THREE.Mesh(new THREE.CylinderGeometry(faceR, faceR, 0.08, 32), mainMat);
    face.rotation.x = Math.PI / 2;
    group.add(face);

    const screen2 = new THREE.Mesh(
      new THREE.CircleGeometry(faceR * 0.85, 32),
      new THREE.MeshPhysicalMaterial({ color: 0x111122, metalness: 0.1, roughness: 0.05, clearcoat: 1.0 })
    );
    screen2.position.z = 0.041;
    group.add(screen2);

    const crownKnob = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.08, 12), accentMat);
    crownKnob.position.set(faceR + 0.04, 0, 0);
    crownKnob.rotation.z = Math.PI / 2;
    group.add(crownKnob);

    const bandCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, faceR + 0.05, 0),
      new THREE.Vector3(0, faceR + 0.4, -0.15),
      new THREE.Vector3(0, faceR + 0.8, -0.05),
    ]);
    const bandGeom = new THREE.TubeGeometry(bandCurve, 20, 0.08, 8, false);
    const band1 = new THREE.Mesh(bandGeom, darkMat);
    group.add(band1);
    const band2 = band1.clone();
    band2.rotation.z = Math.PI;
    group.add(band2);
  } else {
    const body2 = new THREE.Mesh(new THREE.BoxGeometry(1.5 * scale, 0.8 * scale, 1.0 * scale), mainMat);
    body2.geometry = roundEdges(body2.geometry, 0.08);
    group.add(body2);

    const top = new THREE.Mesh(new THREE.BoxGeometry(1.3 * scale, 0.1 * scale, 0.8 * scale), accentMat);
    top.position.y = 0.45 * scale;
    group.add(top);

    const detail1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 16), darkMat);
    detail1.position.set(0.5 * scale, 0, 0.51 * scale);
    detail1.rotation.x = Math.PI / 2;
    group.add(detail1);

    const detail2 = new THREE.Mesh(new THREE.BoxGeometry(0.3 * scale, 0.15 * scale, 0.02), darkMat);
    detail2.position.set(-0.3 * scale, -0.1 * scale, 0.51 * scale);
    group.add(detail2);

    if (isModular) {
      for (let i = 0; i < 3; i++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(0.35 * scale, 0.02, 0.8 * scale), accentMat);
        slot.position.set(-0.45 * scale + i * 0.45 * scale, -0.41 * scale, 0);
        group.add(slot);
      }
    }
  }

  return group;
}

function roundEdges(geometry: THREE.BoxGeometry, _radius: number): THREE.BoxGeometry {
  return geometry;
}

export function CadModelViewer({ productName, productCategory, materials, requirements, className }: CadModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const frameRef = useRef<number>(0);
  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: 0.5 });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(3, 2.5, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8899bb, 0.5);
    fillLight.position.set(-3, 4, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xA05068, 0.3);
    rimLight.position.set(0, 2, -5);
    scene.add(rimLight);

    const gridHelper = new THREE.GridHelper(6, 20, 0x333333, 0x282828);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    const axes = new THREE.AxesHelper(0.5);
    axes.position.set(-2.8, -0.99, -2.8);
    scene.add(axes);

    const matColor = getMaterialColor(materials);
    const accentColor = getAccentColor(materials);
    const model = buildProductGeometry(productCategory, requirements, scene, matColor, accentColor);
    scene.add(model);
    modelRef.current = model;

    const wireGroup = new THREE.Group();
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const wireGeo = new THREE.EdgesGeometry(child.geometry, 15);
        const wireMat = new THREE.LineBasicMaterial({ color: 0x5BA8A0, transparent: true, opacity: 0.15 });
        const wireframe = new THREE.LineSegments(wireGeo, wireMat);
        wireframe.position.copy(child.position);
        wireframe.rotation.copy(child.rotation);
        wireframe.scale.copy(child.scale);
        wireGroup.add(wireframe);
      }
    });
    model.add(wireGroup);

    setIsInitialized(true);

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - prevMouse.current.x;
      const dy = e.clientY - prevMouse.current.y;
      rotation.current.y += dx * 0.008;
      rotation.current.x += dy * 0.008;
      rotation.current.x = Math.max(-1.2, Math.min(1.2, rotation.current.x));
      prevMouse.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging.current = false; };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - prevMouse.current.x;
      const dy = e.touches[0].clientY - prevMouse.current.y;
      rotation.current.y += dx * 0.008;
      rotation.current.x += dy * 0.008;
      rotation.current.x = Math.max(-1.2, Math.min(1.2, rotation.current.x));
      prevMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchEnd = () => { isDragging.current = false; };

    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      if (!isDragging.current) {
        rotation.current.y += 0.003;
      }
      if (modelRef.current) {
        modelRef.current.rotation.y = rotation.current.y;
        modelRef.current.rotation.x = rotation.current.x;
      }
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [productCategory, materials, requirements]);

  return (
    <div className={`relative ${className || ""}`}>
      <div ref={containerRef} className="w-full aspect-square rounded-lg overflow-hidden" style={{ minHeight: 200 }} />
      {isInitialized && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
          <span className="text-[9px] font-mono text-gray-500 bg-black/60 px-1.5 py-0.5 rounded">
            {productName || "Untitled"} — CAD Preview
          </span>
          <span className="text-[9px] font-mono text-gray-500 bg-black/60 px-1.5 py-0.5 rounded">
            Drag to rotate
          </span>
        </div>
      )}
    </div>
  );
}
