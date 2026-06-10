"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { FeatureId } from "./feature-defs";
import { FEATURES } from "./feature-defs";

type Props = {
  active: FeatureId;
  onSelect: (id: FeatureId) => void;
};

// BoxGeometry face order: +x, -x, +y, -y, +z, -z
const FACE_ORDER: FeatureId[] = ["api", "security", "play", "hardware", "seeds", "orbit"];

export function ArtifactCanvas({ active, onSelect }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<FeatureId>(active);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    // Render at 1.6× container so rotating cube corners never reach the buffer edge.
    const cW = el.clientWidth || 520;
    const cH = el.clientHeight || 520;
    const SCALE = 1.6;
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
      width: W + "px",
      height: H + "px",
      pointerEvents: "auto",
    });
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    const fillLight = new THREE.DirectionalLight(0xd0e0ff, 0.25);
    fillLight.position.set(-4, -3, 2);
    scene.add(fillLight);
    const orbitLight = new THREE.PointLight(0xffffff, 2.8, 16);
    orbitLight.position.set(3, 3, 4);
    scene.add(orbitLight);

    const materials: THREE.MeshStandardMaterial[] = FACE_ORDER.map((fId) => {
      const feature = FEATURES.find((f) => f.id === fId)!;
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.18,
        roughness: 0.22,
        transparent: true,
        opacity: 0,
        side: THREE.FrontSide,
      });

      new THREE.TextureLoader().load(
        feature.artworkSrc,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          mat.map = tex;
          mat.emissiveMap = tex;
          mat.emissive = new THREE.Color(0xffffff);
          mat.emissiveIntensity = 0.55;
          mat.needsUpdate = true;
        },
        undefined,
        () => {
          mat.color.set(new THREE.Color(feature.accentColor));
          mat.opacity = 0.7;
          mat.needsUpdate = true;
        },
      );
      return mat;
    });

    const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2, 1, 1, 1), materials);
    scene.add(box);

    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(2.02, 2.02, 2.02)),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 }),
    );
    scene.add(edges);

    // ── floating face elements ─────────────────────────────────────────────────
    // C[i] matches FACE_ORDER: 0=api, 1=security, 2=play, 3=hardware, 4=seeds, 5=orbit
    const C = FACE_ORDER.map(
      (fId) => new THREE.Color(FEATURES.find((f) => f.id === fId)!.accentColor),
    );

    type FEl = {
      mesh: THREE.Object3D;
      base: THREE.Vector3;
      norm: THREE.Vector3;
      phase: number;
      bob: number;
      rotV?: THREE.Vector3;
    };
    const fEls: FEl[] = [];
    const floatGroup = new THREE.Group();
    scene.add(floatGroup);

    // Helper: position mesh on a face, register for animation
    function fe(
      mesh: THREE.Object3D,
      norm: THREE.Vector3,
      su: number, // spread along face "up" axis
      sv: number, // spread along face "side" axis
      offset: number, // outward distance beyond face
      phase: number,
      bob: number, // bob amplitude
      rotV?: THREE.Vector3, // per-frame rotation increment
    ) {
      // Two axes perpendicular to the face normal
      let axU: THREE.Vector3;
      let axV: THREE.Vector3;
      if (Math.abs(norm.x) > 0.5) {
        axU = new THREE.Vector3(0, 1, 0);
        axV = new THREE.Vector3(0, 0, 1);
      } else if (Math.abs(norm.y) > 0.5) {
        axU = new THREE.Vector3(1, 0, 0);
        axV = new THREE.Vector3(0, 0, 1);
      } else {
        axU = new THREE.Vector3(0, 1, 0);
        axV = new THREE.Vector3(1, 0, 0);
      }
      // face centre at norm * 1.0, then push out by offset, spread on face plane
      const base = norm
        .clone()
        .multiplyScalar(1.0 + offset)
        .addScaledVector(axU, su)
        .addScaledVector(axV, sv);
      mesh.position.copy(base);
      floatGroup.add(mesh);
      fEls.push({ mesh, base, norm: norm.clone(), phase, bob, rotV });
    }

    // Face normals
    const NX = new THREE.Vector3(1, 0, 0); // face 0: +x  (api)
    const nX = new THREE.Vector3(-1, 0, 0); // face 1: -x  (security)
    const NY = new THREE.Vector3(0, 1, 0); // face 2: +y  (play)
    const nY = new THREE.Vector3(0, -1, 0); // face 3: -y  (hardware)
    const NZ = new THREE.Vector3(0, 0, 1); // face 4: +z  (seeds)
    const nZ = new THREE.Vector3(0, 0, -1); // face 5: -z  (orbit)

    // ── Face 0 +x — api: thin panel fragments like folding packaging ───────────
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.38, 0.26),
        new THREE.MeshBasicMaterial({
          color: C[0],
          transparent: true,
          opacity: 0.6,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      m.rotation.y = Math.PI / 2; // face toward +x
      fe(m, NX, i < 2 ? -0.35 : 0.35, i % 2 === 0 ? -0.35 : 0.35, 0.12 + i * 0.05, i * 1.2, 0.04);
    }

    // ── Face 1 -x — security: octahedron crystal shards ───────────────────────
    (
      [
        [-0.3, -0.3],
        [-0.3, 0.3],
        [0.3, 0.3],
        [0.3, -0.3],
        [0, 0],
      ] as [number, number][]
    ).forEach(([su, sv], i) => {
      fe(
        new THREE.Mesh(
          new THREE.OctahedronGeometry(0.1, 0),
          new THREE.MeshStandardMaterial({
            color: C[1],
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
            metalness: 0.5,
            roughness: 0.2,
          }),
        ),
        nX,
        su,
        sv,
        0.18 + i * 0.04,
        i * 0.9,
        0.05,
        new THREE.Vector3(0.01, 0.015, 0),
      );
    });

    // ── Face 2 +y — play: horizontal scan-line planes + sphere particles ───────
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(1.3, 0.022),
        new THREE.MeshBasicMaterial({
          color: C[2],
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
        }),
      );
      m.rotation.x = -Math.PI / 2; // lie flat, parallel to top face
      fe(m, NY, 0, (i - 2) * 0.27, 0.12 + i * 0.03, i * 0.7, 0.04);
    }
    for (let i = 0; i < 3; i++) {
      fe(
        new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 8, 6),
          new THREE.MeshBasicMaterial({
            color: C[2],
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
          }),
        ),
        NY,
        (i - 1) * 0.5,
        0,
        0.28 + i * 0.05,
        i * 1.4 + 2,
        0.06,
      );
    }

    // ── Face 3 -y — hardware: tetrahedron diamonds ────────────────────────────
    (
      [
        [-0.4, -0.3],
        [-0.4, 0.3],
        [0.4, 0.3],
        [0.4, -0.3],
        [0, 0],
        [0, 0.5],
      ] as [number, number][]
    ).forEach(([su, sv], i) => {
      fe(
        new THREE.Mesh(
          new THREE.TetrahedronGeometry(0.11, 0),
          new THREE.MeshStandardMaterial({
            color: C[3],
            transparent: true,
            opacity: 0.6,
            depthWrite: false,
            metalness: 0.6,
            roughness: 0.2,
          }),
        ),
        nY,
        su,
        sv,
        0.15 + (i % 3) * 0.06,
        i * 0.8,
        0.05,
        new THREE.Vector3(0.008, 0.012, 0.005),
      );
    });

    // ── Face 4 +z — seeds: torus rings orbiting forward ───────────────────────
    (
      [
        [0.28, 0.014, 0, 0.2],
        [0.5, 0.011, 1.1, 0.26],
        [0.72, 0.009, 2.2, 0.32],
      ] as [number, number, number, number][]
    ).forEach(([r, tube, phase, offset], i) => {
      fe(
        new THREE.Mesh(
          new THREE.TorusGeometry(r, tube, 8, 64),
          new THREE.MeshBasicMaterial({
            color: C[4],
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
          }),
        ),
        NZ,
        0,
        0,
        offset,
        phase,
        0.03,
        new THREE.Vector3(0, 0.005, 0.008 * (i + 1)),
      );
    });

    // ── Face 5 -z — orbit: icosahedra nodes + web lines ───────────────────────
    let updateOrbitWeb: () => void = () => {};
    {
      const orbLayout: [number, number, number][] = [
        [0, 0, 0.2],
        [-0.4, 0.3, 0.23],
        [0.4, 0.3, 0.25],
        [-0.4, -0.3, 0.22],
        [0.4, -0.3, 0.24],
      ];
      const orbMeshes: THREE.Mesh[] = [];
      orbLayout.forEach(([su, sv, offset], i) => {
        const m = new THREE.Mesh(
          new THREE.IcosahedronGeometry(0.07, 0),
          new THREE.MeshBasicMaterial({
            color: C[5],
            transparent: true,
            opacity: 0.65,
            depthWrite: false,
          }),
        );
        fe(m, nZ, su, sv, offset, i * 0.7, 0.04);
        orbMeshes.push(m);
      });
      const maxSegs = (orbMeshes.length * (orbMeshes.length - 1)) / 2;
      const webPts = new Float32Array(maxSegs * 6);
      const webGeo = new THREE.BufferGeometry();
      webGeo.setAttribute("position", new THREE.BufferAttribute(webPts, 3));
      floatGroup.add(
        new THREE.LineSegments(
          webGeo,
          new THREE.LineBasicMaterial({
            color: C[5],
            transparent: true,
            opacity: 0.3,
            depthWrite: false,
          }),
        ),
      );
      updateOrbitWeb = () => {
        const pos = webGeo.attributes.position as THREE.BufferAttribute;
        let vi = 0;
        for (let a = 0; a < orbMeshes.length; a++) {
          for (let b = a + 1; b < orbMeshes.length; b++) {
            const pa = orbMeshes[a].position;
            const pb = orbMeshes[b].position;
            pos.setXYZ(vi, pa.x, pa.y, pa.z);
            pos.setXYZ(vi + 1, pb.x, pb.y, pb.z);
            vi += 2;
          }
        }
        pos.needsUpdate = true;
        webGeo.setDrawRange(0, vi);
      };
    }

    // ── interaction ───────────────────────────────────────────────────────────
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;
    let targetRotY = 0.55;
    let targetRotX = -0.28;
    let pointerMoved = false;
    let pointerProximity = 0;

    const cv = renderer.domElement;
    cv.style.cursor = "grab";

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
      // proximity tracking (always)
      const rect = cv.getBoundingClientRect();
      const dist = Math.hypot(
        e.clientX - (rect.left + rect.width / 2),
        e.clientY - (rect.top + rect.height / 2),
      );
      pointerProximity = Math.max(0, 1 - dist / 120);

      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) pointerMoved = true;
      velX = dx * 0.015;
      velY = dy * 0.015;
      targetRotY += dx * 0.009;
      targetRotX += dy * 0.009;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onUp = (e: PointerEvent) => {
      isDragging = false;
      cv.style.cursor = "grab";
      if (pointerMoved) return;
      const rect = cv.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(mouse, camera);
      const hits = ray.intersectObject(box);
      if (hits.length > 0) {
        const fi = hits[0].face?.materialIndex;
        if (fi != null && fi >= 0 && fi < FACE_ORDER.length) {
          onSelectRef.current(FACE_ORDER[fi]);
        }
      }
    };
    const onLeave = () => {
      pointerProximity = 0;
    };

    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointerleave", onLeave);

    // ── animation ─────────────────────────────────────────────────────────────
    const OPACITY_ACTIVE = 0.95;
    const OPACITY_IDLE = 0.78;
    let fadeT = 0;
    const FADE_FRAMES = 55;

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Fade in
      if (fadeT < FADE_FRAMES) {
        fadeT++;
        const prog = fadeT / FADE_FRAMES;
        materials.forEach((m) => {
          m.opacity = prog * OPACITY_IDLE;
        });
      }

      // Momentum + auto-spin
      if (!isDragging) {
        velX *= 0.9;
        velY *= 0.9;
        targetRotY += velX;
        targetRotX += velY;
        if (Math.abs(velX) < 0.0015 && Math.abs(velY) < 0.0015) {
          targetRotY += 0.004;
        }
      }

      box.rotation.y += (targetRotY - box.rotation.y) * 0.085;
      box.rotation.x += (targetRotX - box.rotation.x) * 0.085;
      edges.rotation.copy(box.rotation);

      // Float group tracks cube rotation exactly
      floatGroup.rotation.copy(box.rotation);

      // Animate float elements: bob + pointer-proximity push
      const sec = Date.now() * 0.001;
      fEls.forEach(({ mesh, base, norm, phase, bob, rotV }) => {
        const push = Math.sin(sec * 1.4 + phase) * bob + pointerProximity * 0.12;
        mesh.position.copy(base).addScaledVector(norm, push);
        if (rotV) {
          mesh.rotation.x += rotV.x;
          mesh.rotation.y += rotV.y;
          mesh.rotation.z += rotV.z;
        }
      });
      updateOrbitWeb();

      // Orbit point light slowly for dynamic specular
      const t = Date.now() * 0.0006;
      orbitLight.position.set(Math.cos(t) * 4, Math.sin(t * 0.7) * 3, Math.sin(t) * 4 + 3);

      // Active face highlight
      if (fadeT >= FADE_FRAMES) {
        const activeIdx = FACE_ORDER.indexOf(activeRef.current);
        materials.forEach((m, i) => {
          const target = i === activeIdx ? OPACITY_ACTIVE : OPACITY_IDLE;
          m.opacity += (target - m.opacity) * 0.08;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize — keep 1.6× buffer ratio
    const ro = new ResizeObserver(() => {
      const w = Math.round(el.clientWidth * SCALE);
      const h = Math.round(el.clientHeight * SCALE);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      Object.assign(renderer.domElement.style, { width: w + "px", height: h + "px" });
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      cv.removeEventListener("pointerdown", onDown);
      cv.removeEventListener("pointermove", onMove);
      cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointerleave", onLeave);
      materials.forEach((m) => m.dispose());
      renderer.dispose();
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", overflow: "visible", touchAction: "none" }}
    />
  );
}
