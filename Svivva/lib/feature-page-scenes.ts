import * as THREE from "three";
import type { FeatureId } from "@/components/svivva-artifact/feature-defs";
import { ARTWORK_MANIFESTS } from "@/lib/artwork-atlas";

export type SceneTick = (t: number) => void;

function scrollNorm(): number {
  const max = document.body.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, window.scrollY / max) : 0;
}

function lineMat(color: number, opacity = 0.5): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
  });
}

function glowMat(color: number, opacity = 0.72): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    transparent: true,
    opacity,
    metalness: 0.45,
    roughness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    depthWrite: false,
  });
}

/** Ornate thorn/filigree wire band — security graphic border motif. */
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
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    lineMat(color, 0.55),
  );
}

/** Concertina razor-wire coil row. */
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
    coil.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat(color, 0.45)));
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

function crystalMesh(color: number, size: number, detail = 1): THREE.Mesh {
  return new THREE.Mesh(new THREE.IcosahedronGeometry(size, detail), glowMat(color));
}

/** 3D music note — sphere head + stem + flag curve. */
function createMusicNote(color: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const mat = glowMat(color, 0.82);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22 * scale, 16, 16), mat);
  head.position.set(0, 0, 0);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, 0.9 * scale, 8), mat);
  stem.position.set(0.18 * scale, 0.55 * scale, 0);
  const flagPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const f = i / 24;
    flagPts.push(
      new THREE.Vector3(
        0.18 * scale + Math.sin(f * Math.PI) * 0.35 * scale,
        0.95 * scale + f * 0.55 * scale,
        Math.cos(f * Math.PI * 2) * 0.08 * scale,
      ),
    );
  }
  const flag = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(flagPts),
    lineMat(color, 0.75),
  );
  g.add(head, stem, flag);
  return g;
}

/** Branching seed filaments radiating from a central core. */
function createSeedBranchSystem(teal: number, rose: number): {
  branches: { line: THREE.Line; angle: number; spread: number }[];
  core: THREE.Mesh;
  buds: THREE.Points;
} {
  const branchCount = 12;
  const segments = 72;
  const branches: { line: THREE.Line; angle: number; spread: number }[] = [];

  for (let b = 0; b < branchCount; b++) {
    const positions = new Float32Array(segments * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = lineMat(b % 3 === 0 ? rose : teal, 0.22 + (b / branchCount) * 0.38);
    const line = new THREE.Line(geo, mat);
    branches.push({
      line,
      angle: (b / branchCount) * Math.PI * 2,
      spread: 0.55 + (b % 5) * 0.12,
    });
  }

  const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55, 0), glowMat(teal, 0.9));

  const budPos = new Float32Array(branchCount * 3);
  const budGeo = new THREE.BufferGeometry();
  budGeo.setAttribute("position", new THREE.BufferAttribute(budPos, 3));
  const buds = new THREE.Points(
    budGeo,
    new THREE.PointsMaterial({
      color: rose,
      size: 0.38,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );

  return { branches, core, buds };
}

/** Wireframe product box with hinged lid. */
function createPackageBox(color: number, w: number, h: number, d: number): {
  group: THREE.Group;
  lid: THREE.Group;
} {
  const group = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.35 }),
  );
  box.position.y = -h / 2;
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    lineMat(color, 0.65),
  );
  edges.position.y = -h / 2;

  const lid = new THREE.Group();
  const lidMesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.12, d),
    new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.5 }),
  );
  const lidEdge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(w, 0.12, d)),
    lineMat(color, 0.8),
  );
  lid.add(lidMesh, lidEdge);
  lid.position.set(0, 0, -d / 2);

  group.add(box, edges, lid);
  return { group, lid };
}

export function buildFeaturePageScene(
  variant: FeatureId,
  scene: THREE.Scene,
  _mouse: { x: number; y: number },
): Promise<SceneTick> {
  const manifest = ARTWORK_MANIFESTS[variant];
  const accent = new THREE.Color(manifest.accentColor);
  const accentHex = accent.getHex();
  const updaters: Array<(t: number, scroll: number) => void> = [];

  switch (variant) {
    case "play": {
      const lines: THREE.Line[] = [];
      for (let i = 0; i < 32; i++) {
        const segs = 96;
        const pos = new Float32Array(segs * 3);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        const line = new THREE.Line(
          geo,
          lineMat(accentHex, 0.1 + (i / 32) * 0.38),
        );
        line.position.y = (i - 16) * 0.32;
        line.position.z = -2 - (i % 4) * 0.3;
        scene.add(line);
        lines.push(line);
      }

      const notes: THREE.Group[] = [];
      const noteColors = [0x9b7fd4, 0xc48fd4, 0x6a8fd4, 0xd4a0e8, 0x7c5cbf];
      const noteSpots: [number, number, number, number][] = [
        [-4.5, 2.2, -1.5, 1.1],
        [-1.5, 3.8, -2, 0.95],
        [2.8, 2.5, -1.8, 1.05],
        [5.2, 0.2, -2.5, 0.85],
        [-3, -2.5, -1.2, 0.9],
        [4, -3, -2.2, 1],
      ];
      noteSpots.forEach(([x, y, z, s], i) => {
        const note = createMusicNote(noteColors[i % noteColors.length], s);
        note.position.set(x, y, z);
        note.rotation.z = (i - 2) * 0.25;
        scene.add(note);
        notes.push(note);
      });

      const ringPts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        ringPts.push(new THREE.Vector3(Math.cos(a) * 5.5, Math.sin(a) * 1.8, -4));
      }
      const pulseRing = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ringPts),
        lineMat(0xc48fd4, 0.35),
      );
      scene.add(pulseRing);

      updaters.push((t, scroll) => {
        lines.forEach((line, i) => {
          const pos = line.geometry.attributes.position as THREE.BufferAttribute;
          for (let s = 0; s < pos.count; s++) {
            const x = (s / (pos.count - 1) - 0.5) * 24;
            pos.setX(s, x);
            pos.setY(
              s,
              Math.sin(x * 0.5 + t * 2.4 + i * 0.22 + scroll * 9) *
                (0.4 + scroll * 1.1 + (i % 5) * 0.03),
            );
            pos.setZ(s, Math.sin(x * 0.18 + t * 1.2) * 0.2);
          }
          pos.needsUpdate = true;
        });
        notes.forEach((note, i) => {
          note.rotation.y = Math.sin(t * 0.45 + i) * 0.35;
          note.position.y += Math.sin(t * 1.1 + i * 0.8) * 0.002;
        });
        pulseRing.rotation.z = t * 0.15 + scroll * 0.8;
        (pulseRing.material as THREE.LineBasicMaterial).opacity = 0.2 + scroll * 0.35;
      });
      break;
    }

    case "seeds": {
      const teal = accentHex;
      const rose = 0x6b2c4a;
      const { branches, core, buds } = createSeedBranchSystem(teal, rose);
      branches.forEach((b) => scene.add(b.line));
      scene.add(core, buds);

      const rings: THREE.Line[] = [];
      for (let r = 0; r < 3; r++) {
        const pts: THREE.Vector3[] = [];
        const radius = 2.2 + r * 1.4;
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius * 0.35, -3 - r));
        }
        const ring = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          lineMat(r % 2 ? rose : teal, 0.25),
        );
        scene.add(ring);
        rings.push(ring);
      }

      updaters.push((t, scroll) => {
        const grow = 7 + scroll * 20;
        branches.forEach((br, b) => {
          const pos = br.line.geometry.attributes.position as THREE.BufferAttribute;
          const ang = br.angle + Math.sin(t * 0.28 + b) * 0.12;
          for (let s = 0; s < pos.count; s++) {
            const f = s / (pos.count - 1);
            const wobble = Math.sin(f * 7 + t + b) * br.spread * f;
            const rad = f * grow;
            pos.setX(s, Math.cos(ang) * rad - Math.sin(ang) * wobble);
            pos.setY(s, Math.sin(ang) * rad + Math.cos(ang) * wobble);
            pos.setZ(s, Math.sin(f * 4 + t * 0.5) * 0.35 * f);
          }
          pos.needsUpdate = true;
          const budPos = buds.geometry.attributes.position as THREE.BufferAttribute;
          budPos.setXYZ(b, Math.cos(ang) * grow, Math.sin(ang) * grow, 0);
          budPos.needsUpdate = true;
        });
        core.rotation.x = t * 0.25;
        core.rotation.y = t * 0.35 + scroll * 1.2;
        core.scale.setScalar(1 + scroll * 0.35);
        rings.forEach((ring, r) => {
          ring.rotation.z = t * (0.08 + r * 0.04) + scroll * 0.5;
          (ring.material as THREE.LineBasicMaterial).opacity = 0.15 + scroll * 0.3;
        });
      });
      break;
    }

    case "orbit": {
      const nodes: THREE.Mesh[] = [];
      const nodeCount = 14;
      const orbitRadii = [3.2, 4.8, 6.2];
      for (let i = 0; i < nodeCount; i++) {
        const ring = orbitRadii[i % orbitRadii.length];
        const a = (i / nodeCount) * Math.PI * 2 + (i % 3) * 0.4;
        const node = new THREE.Mesh(
          new THREE.SphereGeometry(0.14 + (i % 3) * 0.04, 12, 12),
          glowMat(i % 2 ? 0xc06010 : 0xe8a040, 0.85),
        );
        node.position.set(Math.cos(a) * ring, Math.sin(a) * ring * 0.55, -2.5 - (i % 4) * 0.4);
        node.userData.orbit = { ring, a, i };
        scene.add(node);
        nodes.push(node);
      }

      const orbitRings = orbitRadii.map((r, idx) => {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i <= 80; i++) {
          const a = (i / 80) * Math.PI * 2;
          pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.55, -2.8 - idx * 0.3));
        }
        const ring = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          lineMat(accentHex, 0.22),
        );
        scene.add(ring);
        return ring;
      });

      const web = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        lineMat(accentHex, 0.18),
      );
      scene.add(web);

      updaters.push((t, scroll) => {
        nodes.forEach((node) => {
          const { ring, a, i } = node.userData.orbit as { ring: number; a: number; i: number };
          const speed = 0.12 + (i % 5) * 0.03 + scroll * 0.4;
          const ang = a + t * speed;
          node.position.x = Math.cos(ang) * ring;
          node.position.y = Math.sin(ang) * ring * 0.55;
          node.position.z = -2.5 - (i % 4) * 0.4 + Math.sin(t + i) * 0.15;
        });
        const positions: number[] = [];
        for (let a = 0; a < nodes.length; a++) {
          for (let b = a + 1; b < nodes.length; b++) {
            if ((a + b) % 3 !== 0) continue;
            positions.push(
              nodes[a].position.x,
              nodes[a].position.y,
              nodes[a].position.z,
              nodes[b].position.x,
              nodes[b].position.y,
              nodes[b].position.z,
            );
          }
        }
        web.geometry.dispose();
        web.geometry = new THREE.BufferGeometry();
        web.geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        (web.material as THREE.LineBasicMaterial).opacity = 0.1 + scroll * 0.45;
        orbitRings.forEach((ring, idx) => {
          ring.rotation.z = t * (0.05 + idx * 0.02);
        });
      });
      break;
    }

    case "security": {
      const filigreeBands: THREE.Line[] = [];
      for (let b = 0; b < 5; b++) {
        const wire = createFiligreeWire(accentHex, 24);
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
      const topSphere = crystalMesh(0x7b4d9a, 0.9);
      topSphere.position.set(-2.5, 3.5, -3);
      const botSphere = crystalMesh(0x8a5a9e, 0.75);
      botSphere.position.set(2.8, 0.5, -4);
      const vaultRing = new THREE.Mesh(
        new THREE.TorusGeometry(3.5, 0.06, 8, 64, Math.PI * 1.35),
        glowMat(0x6b2c4a, 0.55),
      );
      vaultRing.position.set(0, -1, -4.5);
      vaultRing.rotation.x = Math.PI / 2.2;
      scene.add(topSphere, botSphere, vaultRing);

      updaters.push((t, scroll) => {
        const drift = scroll * 14;
        filigreeBands.forEach((wire, i) => {
          wire.position.y = 6 - i * 3.2 - drift + ((t * 0.4 + i) % 8);
          wire.rotation.z = Math.sin(t * 0.25 + i) * 0.08 + scroll * 0.3;
          (wire.material as THREE.LineBasicMaterial).opacity = 0.35 + scroll * 0.35;
        });
        bobRows.forEach((row, r) => {
          row.position.y = -6 + r * 4 - scroll * 10 + Math.sin(t * 0.5 + r) * 0.2;
          row.children.forEach((coil) => {
            if (coil instanceof THREE.Group) {
              coil.rotation.y = t * 0.35 + scroll * 4 + (coil.userData.phase as number);
              coil.rotation.z = Math.sin(t * 0.6) * 0.12;
            }
          });
        });
        topSphere.rotation.x = t * 0.3 + scroll * 2;
        topSphere.rotation.y = t * 0.45;
        botSphere.rotation.x = t * 0.25;
        botSphere.rotation.y = t * 0.5 + scroll * 1.5;
        botSphere.position.y = 0.5 + Math.sin(t * 0.7) * 0.25 - scroll * 0.8;
        vaultRing.rotation.z = t * 0.12 + scroll * 0.6;
      });
      break;
    }

    case "api": {
      const packages: { group: THREE.Group; lid: THREE.Group; baseY: number }[] = [];
      const specs: [number, number, number, number, number, number][] = [
        [-3.5, 1.5, 1.4, 1.1, 0.9, -2.5],
        [0.5, -0.5, 1.6, 1.3, 1, -3],
        [4, 2.5, 1.2, 0.95, 0.8, -3.5],
        [-1, -3, 1.8, 1.4, 1.1, -2.8],
      ];
      specs.forEach(([x, y, w, h, d, z], i) => {
        const { group, lid } = createPackageBox(accentHex, w, h, d);
        group.position.set(x, y, z);
        group.rotation.y = (i - 1.5) * 0.35;
        scene.add(group);
        packages.push({ group, lid, baseY: y });
      });

      const pipelinePts: THREE.Vector3[] = [];
      specs.forEach(([x, y, , , , z], i) => {
        if (i < specs.length - 1) {
          const [nx, ny, , , , nz] = specs[i + 1];
          const mid = new THREE.Vector3((x + nx) / 2, (y + ny) / 2 + 1.2, (z + nz) / 2);
          pipelinePts.push(new THREE.Vector3(x, y, z), mid, new THREE.Vector3(nx, ny, nz));
        }
      });
      const pipeline = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pipelinePts),
        lineMat(0xd782b2, 0.45),
      );
      scene.add(pipeline);

      updaters.push((t, scroll) => {
        packages.forEach(({ group, lid, baseY }, i) => {
          const open = scroll * Math.PI * 0.55;
          lid.rotation.x = -open * (i % 2 === 0 ? 1 : 0.85);
          group.position.y = baseY + scroll * (i - 1.5) * 0.9 + Math.sin(t * 0.35 + i) * 0.08;
          group.rotation.y = (i - 1.5) * 0.35 + scroll * 0.6 * (i % 2 ? 1 : -1);
        });
        (pipeline.material as THREE.LineBasicMaterial).opacity = 0.25 + scroll * 0.45;
      });
      break;
    }

    case "hardware": {
      const gems: THREE.Mesh[] = [];
      const colors = [0xb5547a, 0x5a9e6a, 0xc04040, 0xd4a85a, 0x8a5a9e];
      const spots: [number, number, number][] = [
        [4, -1.5, 1.15],
        [5.5, 2.5, 0.9],
        [-5, 1, 1],
        [-3.5, -2.8, 0.75],
        [0.5, 3.2, 1.05],
        [-1, 0, 0.85],
      ];
      spots.forEach(([x, y, s], i) => {
        const gem = new THREE.Mesh(
          new THREE.OctahedronGeometry(s, 0),
          glowMat(colors[i % colors.length], 0.7),
        );
        gem.position.set(x, y, -4 - (i % 3) * 0.45);
        scene.add(gem);
        gems.push(gem);
      });

      const latticePts: number[] = [];
      for (let a = 0; a < gems.length; a++) {
        for (let b = a + 1; b < gems.length; b++) {
          if ((a * b) % 4 !== 0) continue;
          latticePts.push(
            gems[a].position.x,
            gems[a].position.y,
            gems[a].position.z,
            gems[b].position.x,
            gems[b].position.y,
            gems[b].position.z,
          );
        }
      }
      const lattice = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        lineMat(0xb5547a, 0.3),
      );
      lattice.geometry.setAttribute("position", new THREE.Float32BufferAttribute(latticePts, 3));
      scene.add(lattice);

      const truss = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.BoxGeometry(14, 8, 2)),
        lineMat(0x5a9e6a, 0.18),
      );
      truss.position.z = -6;
      scene.add(truss);

      updaters.push((t, scroll) => {
        gems.forEach((g, i) => {
          g.rotation.x = t * (0.4 + i * 0.12) + scroll * 2.5;
          g.rotation.y = t * (0.55 + i * 0.08);
          g.position.y += Math.sin(t * 0.8 + i) * 0.003;
        });
        truss.rotation.y = t * 0.08 + scroll * 0.35;
        (lattice.material as THREE.LineBasicMaterial).opacity = 0.15 + scroll * 0.35;
      });
      break;
    }
  }

  return Promise.resolve((t: number) => {
    const scroll = scrollNorm();
    updaters.forEach((fn) => fn(t, scroll));
  });
}
