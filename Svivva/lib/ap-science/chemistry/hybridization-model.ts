/**
 * Hybridization + VSEPR scientific model (AP Chemistry).
 *
 * Assumptions (AP-level, intentional simplifications):
 * - Electron domains: each lone pair OR bonding region counts as ONE domain
 *   (a double/triple bond is still one domain).
 * - Hybridization predicted from electron-domain count on the central atom
 *   (or each carbon in multi-carbon examples).
 * - Bond angles are approximate ideal VSEPR values (not experimental crystallography).
 * - Sigma/pi accounting: single=1σ, double=1σ+1π, triple=1σ+2π.
 * - Positions are pedagogical layouts for visualization, not energy-minimized geometries.
 */

export type Hybridization = "sp" | "sp2" | "sp3" | "sp3d" | "sp3d2";

export type ElectronGeometry =
  | "linear"
  | "trigonal_planar"
  | "tetrahedral"
  | "trigonal_bipyramidal"
  | "octahedral";

export type MolecularGeometry =
  | "linear"
  | "bent"
  | "trigonal_planar"
  | "trigonal_pyramidal"
  | "tetrahedral"
  | "seesaw"
  | "t_shaped"
  | "square_planar"
  | "trigonal_bipyramidal"
  | "octahedral";

export type BondOrder = 1 | 2 | 3;

export type AtomSpec = {
  id: string;
  element: string;
  /** Local pedagogical coordinates (Å-ish units for rendering). */
  position: [number, number, number];
  hybridization?: Hybridization;
};

export type BondSpec = {
  a: string;
  b: string;
  order: BondOrder;
};

export type MoleculeSpec = {
  id: string;
  formula: string;
  name: string;
  /** Atom used for VSEPR questions (often C or central heteroatom). */
  focusAtomId: string;
  electronDomains: number;
  bondingDomains: number;
  lonePairs: number;
  electronGeometry: ElectronGeometry;
  molecularGeometry: MolecularGeometry;
  hybridization: Hybridization;
  approxBondAngleDeg: number;
  sigmaBonds: number;
  piBonds: number;
  polarity: "polar" | "nonpolar";
  atoms: AtomSpec[];
  bonds: BondSpec[];
  teachingNotes: string[];
};

export function hybridizationFromDomains(domains: number): Hybridization | null {
  switch (domains) {
    case 2:
      return "sp";
    case 3:
      return "sp2";
    case 4:
      return "sp3";
    case 5:
      return "sp3d";
    case 6:
      return "sp3d2";
    default:
      return null;
  }
}

export function electronGeometryFromDomains(domains: number): ElectronGeometry | null {
  switch (domains) {
    case 2:
      return "linear";
    case 3:
      return "trigonal_planar";
    case 4:
      return "tetrahedral";
    case 5:
      return "trigonal_bipyramidal";
    case 6:
      return "octahedral";
    default:
      return null;
  }
}

export function idealBondAngleDeg(electronGeometry: ElectronGeometry): number {
  switch (electronGeometry) {
    case "linear":
      return 180;
    case "trigonal_planar":
      return 120;
    case "tetrahedral":
      return 109.5;
    case "trigonal_bipyramidal":
      return 90; // equatorial/axial ideal pair; UI notes both 90 and 120
    case "octahedral":
      return 90;
  }
}

export function sigmaPiFromOrder(order: BondOrder): { sigma: number; pi: number } {
  if (order === 1) return { sigma: 1, pi: 0 };
  if (order === 2) return { sigma: 1, pi: 1 };
  return { sigma: 1, pi: 2 };
}

export function countSigmaPi(bonds: BondSpec[]): { sigma: number; pi: number } {
  return bonds.reduce(
    (acc, b) => {
      const sp = sigmaPiFromOrder(b.order);
      return { sigma: acc.sigma + sp.sigma, pi: acc.pi + sp.pi };
    },
    { sigma: 0, pi: 0 },
  );
}

/** Tetrahedral vertices around origin (normalized). */
const TET = [
  [1, 1, 1],
  [1, -1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
].map((v) => {
  const n = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / n, v[1] / n, v[2] / n] as [number, number, number];
});

function scale(p: [number, number, number], s: number): [number, number, number] {
  return [p[0] * s, p[1] * s, p[2] * s];
}

function add(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export const HYBRIDIZATION_MOLECULES: MoleculeSpec[] = [
  {
    id: "ch4",
    formula: "CH₄",
    name: "Methane",
    focusAtomId: "C",
    electronDomains: 4,
    bondingDomains: 4,
    lonePairs: 0,
    electronGeometry: "tetrahedral",
    molecularGeometry: "tetrahedral",
    hybridization: "sp3",
    approxBondAngleDeg: 109.5,
    sigmaBonds: 4,
    piBonds: 0,
    polarity: "nonpolar",
    atoms: [
      { id: "C", element: "C", position: [0, 0, 0], hybridization: "sp3" },
      { id: "H1", element: "H", position: scale(TET[0], 1.6) },
      { id: "H2", element: "H", position: scale(TET[1], 1.6) },
      { id: "H3", element: "H", position: scale(TET[2], 1.6) },
      { id: "H4", element: "H", position: scale(TET[3], 1.6) },
    ],
    bonds: [
      { a: "C", b: "H1", order: 1 },
      { a: "C", b: "H2", order: 1 },
      { a: "C", b: "H3", order: 1 },
      { a: "C", b: "H4", order: 1 },
    ],
    teachingNotes: [
      "Four bonding domains → tetrahedral electron geometry → sp³.",
      "All C–H bonds are sigma (σ) bonds from sp³–1s overlap.",
    ],
  },
  {
    id: "c2h6",
    formula: "C₂H₆",
    name: "Ethane",
    focusAtomId: "C1",
    electronDomains: 4,
    bondingDomains: 4,
    lonePairs: 0,
    electronGeometry: "tetrahedral",
    molecularGeometry: "tetrahedral",
    hybridization: "sp3",
    approxBondAngleDeg: 109.5,
    sigmaBonds: 7,
    piBonds: 0,
    polarity: "nonpolar",
    atoms: [
      { id: "C1", element: "C", position: [-0.8, 0, 0], hybridization: "sp3" },
      { id: "C2", element: "C", position: [0.8, 0, 0], hybridization: "sp3" },
      { id: "H1", element: "H", position: [-1.6, 1.1, 0.6] },
      { id: "H2", element: "H", position: [-1.6, -1.1, 0.6] },
      { id: "H3", element: "H", position: [-1.6, 0, -1.2] },
      { id: "H4", element: "H", position: [1.6, 1.1, 0.6] },
      { id: "H5", element: "H", position: [1.6, -1.1, 0.6] },
      { id: "H6", element: "H", position: [1.6, 0, -1.2] },
    ],
    bonds: [
      { a: "C1", b: "C2", order: 1 },
      { a: "C1", b: "H1", order: 1 },
      { a: "C1", b: "H2", order: 1 },
      { a: "C1", b: "H3", order: 1 },
      { a: "C2", b: "H4", order: 1 },
      { a: "C2", b: "H5", order: 1 },
      { a: "C2", b: "H6", order: 1 },
    ],
    teachingNotes: [
      "C–C single bond = 1 σ bond (sp³–sp³ overlap).",
      "Each carbon is tetrahedral / sp³ like methane.",
    ],
  },
  {
    id: "c2h4",
    formula: "C₂H₄",
    name: "Ethene",
    focusAtomId: "C1",
    electronDomains: 3,
    bondingDomains: 3,
    lonePairs: 0,
    electronGeometry: "trigonal_planar",
    molecularGeometry: "trigonal_planar",
    hybridization: "sp2",
    approxBondAngleDeg: 120,
    sigmaBonds: 5,
    piBonds: 1,
    polarity: "nonpolar",
    atoms: [
      { id: "C1", element: "C", position: [-0.7, 0, 0], hybridization: "sp2" },
      { id: "C2", element: "C", position: [0.7, 0, 0], hybridization: "sp2" },
      { id: "H1", element: "H", position: [-1.5, 1.0, 0] },
      { id: "H2", element: "H", position: [-1.5, -1.0, 0] },
      { id: "H3", element: "H", position: [1.5, 1.0, 0] },
      { id: "H4", element: "H", position: [1.5, -1.0, 0] },
    ],
    bonds: [
      { a: "C1", b: "C2", order: 2 },
      { a: "C1", b: "H1", order: 1 },
      { a: "C1", b: "H2", order: 1 },
      { a: "C2", b: "H3", order: 1 },
      { a: "C2", b: "H4", order: 1 },
    ],
    teachingNotes: [
      "C=C = 1 σ + 1 π. The π bond comes from sideways overlap of unhybridized p orbitals.",
      "Each carbon: 3 domains → trigonal planar → sp².",
    ],
  },
  {
    id: "c2h2",
    formula: "C₂H₂",
    name: "Ethyne",
    focusAtomId: "C1",
    electronDomains: 2,
    bondingDomains: 2,
    lonePairs: 0,
    electronGeometry: "linear",
    molecularGeometry: "linear",
    hybridization: "sp",
    approxBondAngleDeg: 180,
    sigmaBonds: 3,
    piBonds: 2,
    polarity: "nonpolar",
    atoms: [
      { id: "C1", element: "C", position: [-0.7, 0, 0], hybridization: "sp" },
      { id: "C2", element: "C", position: [0.7, 0, 0], hybridization: "sp" },
      { id: "H1", element: "H", position: [-2.0, 0, 0] },
      { id: "H2", element: "H", position: [2.0, 0, 0] },
    ],
    bonds: [
      { a: "C1", b: "C2", order: 3 },
      { a: "C1", b: "H1", order: 1 },
      { a: "C2", b: "H2", order: 1 },
    ],
    teachingNotes: [
      "C≡C = 1 σ + 2 π bonds.",
      "Each carbon: 2 domains → linear → sp; two unhybridized p orbitals form the two π bonds.",
    ],
  },
  {
    id: "co2",
    formula: "CO₂",
    name: "Carbon dioxide",
    focusAtomId: "C",
    electronDomains: 2,
    bondingDomains: 2,
    lonePairs: 0,
    electronGeometry: "linear",
    molecularGeometry: "linear",
    hybridization: "sp",
    approxBondAngleDeg: 180,
    sigmaBonds: 2,
    piBonds: 2,
    polarity: "nonpolar",
    atoms: [
      { id: "C", element: "C", position: [0, 0, 0], hybridization: "sp" },
      { id: "O1", element: "O", position: [-1.8, 0, 0] },
      { id: "O2", element: "O", position: [1.8, 0, 0] },
    ],
    bonds: [
      { a: "C", b: "O1", order: 2 },
      { a: "C", b: "O2", order: 2 },
    ],
    teachingNotes: [
      "Two double bonds = two domains on carbon → linear / sp.",
      "Molecule is nonpolar overall despite polar C=O bonds (cancel).",
    ],
  },
  {
    id: "bf3",
    formula: "BF₃",
    name: "Boron trifluoride",
    focusAtomId: "B",
    electronDomains: 3,
    bondingDomains: 3,
    lonePairs: 0,
    electronGeometry: "trigonal_planar",
    molecularGeometry: "trigonal_planar",
    hybridization: "sp2",
    approxBondAngleDeg: 120,
    sigmaBonds: 3,
    piBonds: 0,
    polarity: "nonpolar",
    atoms: [
      { id: "B", element: "B", position: [0, 0, 0], hybridization: "sp2" },
      { id: "F1", element: "F", position: [1.7, 0, 0] },
      { id: "F2", element: "F", position: [-0.85, 1.47, 0] },
      { id: "F3", element: "F", position: [-0.85, -1.47, 0] },
    ],
    bonds: [
      { a: "B", b: "F1", order: 1 },
      { a: "B", b: "F2", order: 1 },
      { a: "B", b: "F3", order: 1 },
    ],
    teachingNotes: [
      "Three bonding domains, no lone pairs → trigonal planar → sp².",
      "Classic exception to the octet rule (B often has 6 electrons).",
    ],
  },
  {
    id: "nh3",
    formula: "NH₃",
    name: "Ammonia",
    focusAtomId: "N",
    electronDomains: 4,
    bondingDomains: 3,
    lonePairs: 1,
    electronGeometry: "tetrahedral",
    molecularGeometry: "trigonal_pyramidal",
    hybridization: "sp3",
    approxBondAngleDeg: 107,
    sigmaBonds: 3,
    piBonds: 0,
    polarity: "polar",
    atoms: [
      { id: "N", element: "N", position: [0, 0.35, 0], hybridization: "sp3" },
      { id: "H1", element: "H", position: scale(TET[1], 1.5) },
      { id: "H2", element: "H", position: scale(TET[2], 1.5) },
      { id: "H3", element: "H", position: scale(TET[3], 1.5) },
    ],
    bonds: [
      { a: "N", b: "H1", order: 1 },
      { a: "N", b: "H2", order: 1 },
      { a: "N", b: "H3", order: 1 },
    ],
    teachingNotes: [
      "Lone pair counts as a domain → electron geometry tetrahedral, molecular geometry trigonal pyramidal.",
      "Bond angle slightly < 109.5° due to lone-pair repulsion (AP-level approximation ~107°).",
    ],
  },
  {
    id: "h2o",
    formula: "H₂O",
    name: "Water",
    focusAtomId: "O",
    electronDomains: 4,
    bondingDomains: 2,
    lonePairs: 2,
    electronGeometry: "tetrahedral",
    molecularGeometry: "bent",
    hybridization: "sp3",
    approxBondAngleDeg: 104.5,
    sigmaBonds: 2,
    piBonds: 0,
    polarity: "polar",
    atoms: [
      { id: "O", element: "O", position: [0, 0.4, 0], hybridization: "sp3" },
      { id: "H1", element: "H", position: add(scale(TET[1], 1.4), [0, 0.1, 0]) },
      { id: "H2", element: "H", position: add(scale(TET[2], 1.4), [0, 0.1, 0]) },
    ],
    bonds: [
      { a: "O", b: "H1", order: 1 },
      { a: "O", b: "H2", order: 1 },
    ],
    teachingNotes: [
      "Two lone pairs + two bonds → bent molecular geometry from tetrahedral electron geometry.",
      "Hybridization still sp³ even though the molecular shape is bent — a common AP misconception trap.",
    ],
  },
];

export function getMolecule(id: string): MoleculeSpec | undefined {
  return HYBRIDIZATION_MOLECULES.find((m) => m.id === id);
}

export function labelHybridization(h: Hybridization): string {
  return h.replace("2", "²").replace("3", "³");
}

export function labelGeometry(g: ElectronGeometry | MolecularGeometry): string {
  return g.replace(/_/g, " ");
}
