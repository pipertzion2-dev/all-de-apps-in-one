import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";
import {
  addSceneFloaters,
  createRegionPlane,
  loadArtworkTexture,
  tickFloaters,
} from "@/lib/artwork-three";

export type SceneTick = (t: number) => void;

function scrollNorm(): number {
  const max = document.body.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, window.scrollY / max) : 0;
}

/** Ornate thorn/filigree wire band — matches security graphic border. */
function createFiligreeWire(color: number, width: number): THREE.Line {
  const pts: THREE.Vector3[] = [];
  const segments = 120;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = (t - 0.5) * width;
    const thorn = Math.sin(t * Math.PI * 18) * 0.35 + Math.sin(t * Math.PI * 42) * 0.15;
    const curl = Math.sin(t * Math.PI * 6) * 0.5;
    pts.push(new THREE.Vector3(x, thorn + curl, Math.sin(t * Math.PI * 9) * 0.2));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false }),
  );
}

/** Concertina razor-wire coil row — scroll-driven helix twist. */
function createBobWireRow(color: number, y: number, coils: number): THREE.Group {
  const row = new THREE.Group();
  row.position.y = y;
  for (let c = 0; c < coils; c++) {
    const coil = new THREE.Group();
    const rx = 0.55;
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * 0.38, Math.sin(a) * 0.12));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.45, depthWrite: false }),
    );
    coil.add(line);
    for (let s = 0; s < 16; s++) {
      const a = (s / 16) * Math.PI * 2;
      const spike = new THREE.Mesh(
        new THREE.ConeGeometry(0.04, 0.18, 3),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5, depthWrite: false }),
      );
      spike.position.set(Math.cos(a) * rx, Math.sin(a) * 0.38, 0);
      spike.rotation.z = a + Math.PI / 2;
      coil.add(spike);
    }
    coil.position.x = (c - (coils - 1) / 2) * 1.15;
    coil.userData.phase = c * 0.7;
    row.add(coil);
  }
  return row;
}

function crystalSphere(color: number, size: number): THREE.Mesh {
  return new THREE.Mesh(
    new THREE.IcosahedronGeometry(size, 1),
    new THREE.MeshPhysicalMaterial({
      color,
      transparent: true,
      opacity: 0.75,
      metalness: 0.35,
      roughness: 0.15,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      depthWrite: false,
    }),
  );
}

export async function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Scene,
  mouse: { x: number; y: number },
): Promise<SceneTick> {
  const manifest = ARTWORK_MANIFESTS[variant];
  const tex = await loadArtworkTexture(manifest.src);
  const floaters = addSceneFloaters(scene, tex, manifest.sceneElements);
  const accent = new THREE.Color(manifest.accentColor);
  const updaters: Array<(t: number, scroll: number) => void> = [];

  switch (variant) {
    case "play": {
      const lines: THREE.Line[] = [];
      for (let i = 0; i < 28; i++) {
        const segs = 80;
        const pos = new Float32Array(segs * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const line = new THREE.Line(
          geo,
          new THREE.LineBasicMaterial({
            color: accent,
            transparent: true,
            opacity: 0.12 + (i / 28) * 0.35,
            depthWrite: false,
          }),
        );
        line.position.y = (i - 14) * 0.35;
        scene.add(line);
        lines.push(line);
      }
      updaters.push((t, scroll) => {
        lines.forEach((line, i) => {
          const pos = line.geometry.attributes.position as THREE.BufferAttribute;
          for (let s = 0; s < pos.count; s++) {
            const x = (s / (pos.count - 1) - 0.5) * 22;
            pos.setX(s, x);
            pos.setY(
              s,
              Math.sin(x * 0.55 + t * 2.2 + i * 0.25 + scroll * 8) *
                (0.35 + scroll * 1.2 + i * 0.02),
            );
            pos.setZ(s, Math.sin(x * 0.2 + t) * 0.15);
          }
          pos.needsUpdate = true;
        });
      });
      break;
    }

    case "seeds": {
      const quadPanels: THREE.Mesh[] = [];
      const quads = [
        { u: 0.03, v: 0.14, w: 0.44, h: 0.36, x: -4.8, y: 2.6, z: -2.5, rz: -0.12 },
        { u: 0.54, v: 0.14, w: 0.42, h: 0.36, x: 4.6, y: 2.2, z: -3.2, rz: 0.1 },
        { u: 0.03, v: 0.54, w: 0.44, h: 0.36, x: -4.2, y: -2.4, z: -2.8, rz: 0.08 },
        { u: 0.54, v: 0.54, w: 0.42, h: 0.36, x: 5, y: -2.1, z: -3.5, rz: -0.14 },
      ];
      quads.forEach((q) => {
        const plane = createRegionPlane(tex, q, 5.8, 4.6, 0.96);
        plane.position.set(q.x, q.y, q.z);
        plane.rotation.z = q.rz;
        scene.add(plane);
        quadPanels.push(plane);
      });

      const staffLines: THREE.Line[] = [];
      const staffBaseY: number[] = [];
      const staffMat = new THREE.LineBasicMaterial({
        color: 0x9b6b8a,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      });
      for (let s = 0; s < 5; s++) {
        const y = 5.2 - s * 0.28;
        const top = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-11, y, -1.5),
            new THREE.Vector3(11, y, -1.5),
          ]),
          staffMat.clone(),
        );
        const bot = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-11, -y, -1.8),
            new THREE.Vector3(11, -y, -1.8),
          ]),
          staffMat.clone(),
        );
        scene.add(top, bot);
        staffLines.push(top, bot);
        staffBaseY.push(y, -y);
      }

      const headerBanner = createRegionPlane(tex, { id: "header", u: 0, v: 0, w: 1, h: 0.12 }, 14, 1.4, 0.88);
      headerBanner.position.set(0, 5.8, -2);
      scene.add(headerBanner);

      updaters.push((t, scroll) => {
        quadPanels.forEach((plane, i) => {
          const spread = 1 + scroll * 0.45;
          const base = quads[i];
          plane.position.x = base.x * spread + Math.sin(t * 0.35 + i) * 0.25;
          plane.position.y = base.y + scroll * (i % 2 === 0 ? -1.2 : 1.2);
          plane.rotation.y = Math.sin(t * 0.25 + i) * 0.18 + scroll * 0.35 * (i % 2 ? 1 : -1);
          (plane.material as THREE.MeshBasicMaterial).opacity = 0.72 + scroll * 0.22;
        });
        staffLines.forEach((line, i) => {
          line.position.y = staffBaseY[i] + Math.sin(t * 0.4 + i) * 0.08;
          (line.material as THREE.LineBasicMaterial).opacity = 0.45 + scroll * 0.35;
        });
        headerBanner.position.y = 5.8 - scroll * 2.5;
        floaters.forEach((f) => {
          ((f.object as THREE.Sprite).material as THREE.SpriteMaterial).opacity =
            0.78 + scroll * 0.15;
        });
      });
      break;
    }

    case "orbit": {
      const web = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.25 }),
      );
      scene.add(web);
      updaters.push((_t, scroll) => {
        const nodes = floaters.map((f) => f.object.position);
        const maxSegs = (nodes.length * (nodes.length - 1)) / 2;
        const webPts = new Float32Array(maxSegs * 6);
        let vi = 0;
        for (let a = 0; a < nodes.length; a++) {
          for (let b = a + 1; b < nodes.length; b++) {
            webPts[vi++] = nodes[a].x;
            webPts[vi++] = nodes[a].y;
            webPts[vi++] = nodes[a].z;
            webPts[vi++] = nodes[b].x;
            webPts[vi++] = nodes[b].y;
            webPts[vi++] = nodes[b].z;
          }
        }
        web.geometry.dispose();
        web.geometry = new THREE.BufferGeometry();
        web.geometry.setAttribute("position", new THREE.BufferAttribute(webPts.subarray(0, vi), 3));
        (web.material as THREE.LineBasicMaterial).opacity = 0.12 + scroll * 0.4;
      });
      break;
    }

    case "security": {
      const filigreeBands: THREE.Line[] = [];
      for (let b = 0; b < 5; b++) {
        const wire = createFiligreeWire(accent.getHex(), 24);
        wire.position.y = 6 - b * 3.2;
        wire.position.z = -3 - b * 0.4;
        scene.add(wire);
        filigreeBands.push(wire);
      }
      const bobRows: THREE.Group[] = [];
      for (let r = 0; r < 3; r++) {
        const row = createBobWireRow(0x9b6b8a, -4 + r * 4, 10);
        row.position.z = -2 - r * 0.5;
        scene.add(row);
        bobRows.push(row);
      }
      const topSphere = crystalSphere(0x7b4d9a, 0.9);
      topSphere.position.set(-2.5, 3.5, -3);
      const botSphere = crystalSphere(0x8a5a9e, 0.75);
      botSphere.position.set(2.8, 0.5, -4);
      scene.add(topSphere, botSphere);

      updaters.push((t, scroll) => {
        const drift = scroll * 14;
        filigreeBands.forEach((wire, i) => {
          wire.position.y = 6 - i * 3.2 - drift + ((t * 0.4 + i) % 8);
          wire.rotation.z = Math.sin(t * 0.25 + i) * 0.08 + scroll * 0.3;
          (wire.material as THREE.LineBasicMaterial).opacity = 0.35 + scroll * 0.35;
        });
        bobRows.forEach((row, r) => {
          row.position.y = -6 + r * 4 - scroll * 10 + Math.sin(t * 0.5 + r) * 0.2;
          row.children.forEach((coil, c) => {
            if (coil instanceof THREE.Group) {
              coil.rotation.y = t * 0.35 + scroll * 4 + (coil.userData.phase as number);
              coil.rotation.z = Math.sin(t * 0.6 + c) * 0.12;
            }
          });
        });
        topSphere.rotation.x = t * 0.3 + scroll * 2;
        topSphere.rotation.y = t * 0.45;
        botSphere.rotation.x = t * 0.25;
        botSphere.rotation.y = t * 0.5 + scroll * 1.5;
        botSphere.position.y = 0.5 + Math.sin(t * 0.7) * 0.25 - scroll * 0.8;
      });
      break;
    }

    case "api": {
      const panels = [
        { u: 0.55, v: 0.52, w: 0.38, h: 0.4, x: 3.5, y: -1.5, rz: 0.2 },
        { u: 0.02, v: 0.06, w: 0.32, h: 0.32, x: -4, y: 2, rz: -0.15 },
        { u: 0.32, v: 0.22, w: 0.36, h: 0.26, x: 0, y: 0.5, rz: 0 },
        { u: 0.55, v: 0.02, w: 0.4, h: 0.32, x: 4, y: 3, rz: 0.35 },
      ];
      panels.forEach((p, i) => {
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(2.2, 1.6),
          new THREE.MeshBasicMaterial({
            map: tex.clone(),
            transparent: true,
            opacity: 0.5,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        const mat = plane.material as THREE.MeshBasicMaterial;
        if (mat.map) {
          mat.map.repeat.set(p.w, p.h);
          mat.map.offset.set(p.u, 1 - p.v - p.h);
          mat.map.needsUpdate = true;
        }
        plane.position.set(p.x, p.y, -4 - i * 0.4);
        plane.rotation.z = p.rz;
        scene.add(plane);
        updaters.push((t, scroll) => {
          const open = scroll * Math.PI * 0.45;
          plane.rotation.y = open * (i % 2 === 0 ? 1 : -1) + Math.sin(t * 0.3 + i) * 0.05;
          plane.position.y = p.y + scroll * (i - 1.5) * 0.8;
          mat.opacity = 0.35 + scroll * 0.35;
        });
      });
      break;
    }

    case "hardware": {
      const gems: THREE.Mesh[] = [];
      const colors = [0xb5547a, 0x5a9e6a, 0xc04040];
      [
        [4, -1.5, 1.1],
        [5.5, 2.5, 0.85],
        [-5, 1, 0.95],
      ].forEach(([x, y, s], i) => {
        const gem = new THREE.Mesh(
          new THREE.OctahedronGeometry(s, 0),
          new THREE.MeshPhysicalMaterial({
            color: colors[i],
            transparent: true,
            opacity: 0.65,
            metalness: 0.5,
            roughness: 0.2,
            depthWrite: false,
          }),
        );
        gem.position.set(x, y, -4 - i * 0.5);
        scene.add(gem);
        gems.push(gem);
      });
      updaters.push((t, scroll) => {
        gems.forEach((g, i) => {
          g.rotation.x = t * (0.4 + i * 0.15) + scroll * 3;
          g.rotation.y = t * (0.55 + i * 0.1);
        });
      });
      break;
    }
  }

  return (t: number) => {
    const scroll = scrollNorm();
    tickFloaters(floaters, mouse, t);
    updaters.forEach((fn) => fn(t, scroll));
  };
}
