import type { ApConcept, ApQuestion, MisconceptionTag } from "@/lib/ap-science/types";
import { HYBRIDIZATION_MOLECULES } from "@/lib/ap-science/chemistry/hybridization-model";

export const HYBRIDIZATION_CONCEPT: ApConcept = {
  id: "chem-hybridization-vsepr",
  subject: "ap-chemistry",
  unit: "Molecular Structure & Bonding",
  topic: "Hybridization & VSEPR",
  title: "Hybridization, VSEPR, and σ/π bonding",
  prerequisites: ["chem-lewis-basics"],
  learningObjectives: [
    "Predict electron-domain and molecular geometry from Lewis structure / domain count",
    "Connect domain count to sp / sp² / sp³ hybridization",
    "Account for sigma and pi bonds in single, double, and triple bonds",
    "Distinguish electron geometry from molecular geometry when lone pairs are present",
  ],
  explanation:
    "Hybridization mixes atomic orbitals to form hybrid orbitals that match VSEPR electron-domain geometry. Bonding regions and lone pairs both count as domains. Multiple bonds still count as one domain, but contribute π bonds in addition to the σ framework.",
  vocabulary: [
    {
      term: "Electron domain",
      definition: "A lone pair or a bonding region (single/double/triple) around a central atom.",
    },
    {
      term: "Sigma (σ) bond",
      definition:
        "Head-on orbital overlap along the internuclear axis; present in every bond order.",
    },
    {
      term: "Pi (π) bond",
      definition:
        "Sideways overlap of unhybridized p orbitals; present in double (1π) and triple (2π) bonds.",
    },
    {
      term: "VSEPR",
      definition:
        "Valence Shell Electron Pair Repulsion — geometry from minimizing domain repulsions.",
    },
  ],
  misconceptions: [
    "electron_vs_molecular_geometry",
    "double_bond_as_two_domains",
    "sp2_without_p_orbital",
    "sigma_vs_pi",
  ],
  equations: ["domains → hybridization", "bond order → σ/π count"],
  difficulty: 3,
  masteryCriteria: { minCorrect: 5, minAccuracy: 0.75, requireTransfer: true },
  relatedConcepts: ["chem-lewis-basics", "chem-polarity", "chem-imfs"],
  visualizationId: "hybridization-explorer",
};

export const MISCONCEPTION_COPY: Record<
  MisconceptionTag,
  { title: string; explanation: string; nextFocus: string }
> = {
  electron_vs_molecular_geometry: {
    title: "Electron vs molecular geometry",
    explanation:
      "Electron geometry includes lone pairs. Molecular geometry describes only atom positions. NH₃ is tetrahedral electronically but trigonal pyramidal molecularly.",
    nextFocus: "Compare NH₃ and CH₄ domain counts side by side.",
  },
  double_bond_as_two_domains: {
    title: "Multiple bonds ≠ multiple domains",
    explanation:
      "A double or triple bond is still ONE electron domain for VSEPR/hybridization counting, even though it contains π bonds.",
    nextFocus: "Recount domains on C₂H₄ and CO₂ treating each multiple bond as one domain.",
  },
  sp2_without_p_orbital: {
    title: "Unhybridized p orbital remains",
    explanation:
      "sp² uses three hybrids for the σ framework. One pure p orbital remains and forms the π bond in alkenes.",
    nextFocus: "Toggle orbital view on ethene and locate the p–p π overlap.",
  },
  sigma_vs_pi: {
    title: "Sigma vs pi accounting",
    explanation:
      "Every bond order starts with one σ. Extra bonds are π: double = 1σ+1π, triple = 1σ+2π.",
    nextFocus: "Walk C–C, C=C, C≡C in ethane → ethene → ethyne.",
  },
  velocity_vs_acceleration: {
    title: "Velocity vs acceleration",
    explanation: "Velocity is rate of position change; acceleration is rate of velocity change.",
    nextFocus: "Compare synchronized x–t and v–t graphs.",
  },
  motion_requires_force: {
    title: "Motion does not require net force",
    explanation: "Constant velocity needs zero net force (Newton’s first law).",
    nextFocus: "Force board with friction toggled off.",
  },
  diffusion_stops_at_eq: {
    title: "Diffusion at equilibrium",
    explanation: "Net diffusion stops at equilibrium; random molecular motion continues.",
    nextFocus: "Membrane transport explorer at equilibrium.",
  },
  transcription_vs_translation: {
    title: "Transcription vs translation",
    explanation: "Transcription makes RNA from DNA; translation builds polypeptide from mRNA.",
    nextFocus: "Central dogma flow diagram.",
  },
  generic: {
    title: "Review the concept",
    explanation: "Revisit the visualization, then retry a related question.",
    nextFocus: "Return to guided prediction steps.",
  },
};

function mcq(
  id: string,
  prompt: string,
  choices: { id: string; label: string }[],
  correct: string,
  explanation: string,
  misconceptionByChoice: Record<string, MisconceptionTag>,
  difficulty: 1 | 2 | 3 | 4 | 5,
  transfer = false,
): ApQuestion {
  return {
    id,
    conceptId: HYBRIDIZATION_CONCEPT.id,
    type: "multiple_choice",
    prompt,
    choices,
    correctChoiceId: correct,
    explanation,
    misconceptionByChoice,
    difficulty,
    transfer,
  };
}

export const HYBRIDIZATION_QUESTIONS: ApQuestion[] = [
  mcq(
    "hyb-q1",
    "For CH₄, what is the electron-domain geometry around carbon?",
    [
      { id: "a", label: "Trigonal planar" },
      { id: "b", label: "Tetrahedral" },
      { id: "c", label: "Linear" },
      { id: "d", label: "Bent" },
    ],
    "b",
    "Four bonding domains → tetrahedral electron geometry.",
    {
      a: "double_bond_as_two_domains",
      c: "generic",
      d: "electron_vs_molecular_geometry",
    },
    1,
  ),
  mcq(
    "hyb-q2",
    "What hybridization best describes carbon in CH₄?",
    [
      { id: "a", label: "sp" },
      { id: "b", label: "sp²" },
      { id: "c", label: "sp³" },
      { id: "d", label: "sp³d" },
    ],
    "c",
    "Four domains → sp³.",
    { a: "generic", b: "generic", d: "generic" },
    1,
  ),
  mcq(
    "hyb-q3",
    "In C₂H₄ (ethene), the C=C bond contains:",
    [
      { id: "a", label: "2 σ bonds" },
      { id: "b", label: "1 σ + 1 π" },
      { id: "c", label: "2 π bonds only" },
      { id: "d", label: "1 σ + 2 π" },
    ],
    "b",
    "A double bond = one sigma + one pi.",
    { a: "sigma_vs_pi", c: "sigma_vs_pi", d: "sigma_vs_pi" },
    2,
  ),
  mcq(
    "hyb-q4",
    "For NH₃, electron geometry vs molecular geometry:",
    [
      { id: "a", label: "Both trigonal planar" },
      { id: "b", label: "Tetrahedral electron; trigonal pyramidal molecular" },
      { id: "c", label: "Both tetrahedral" },
      { id: "d", label: "Trigonal planar electron; bent molecular" },
    ],
    "b",
    "Lone pair is a domain (tetrahedral electron geometry) but not an atom in the molecular shape.",
    {
      a: "electron_vs_molecular_geometry",
      c: "electron_vs_molecular_geometry",
      d: "electron_vs_molecular_geometry",
    },
    3,
  ),
  mcq(
    "hyb-q5",
    "How many electron domains does carbon have in CO₂?",
    [
      { id: "a", label: "4 (two doubles count as four)" },
      { id: "b", label: "2" },
      { id: "c", label: "3" },
      { id: "d", label: "1" },
    ],
    "b",
    "Each double bond is one domain → two domains → linear / sp.",
    { a: "double_bond_as_two_domains", c: "double_bond_as_two_domains", d: "generic" },
    3,
  ),
  mcq(
    "hyb-q6",
    "C≡C in ethyne consists of:",
    [
      { id: "a", label: "3 σ bonds" },
      { id: "b", label: "1 σ + 2 π" },
      { id: "c", label: "2 σ + 1 π" },
      { id: "d", label: "3 π bonds" },
    ],
    "b",
    "Triple bond = 1 sigma + 2 pi.",
    { a: "sigma_vs_pi", c: "sigma_vs_pi", d: "sigma_vs_pi" },
    2,
  ),
  mcq(
    "hyb-q7",
    "Water is bent and still described as sp³ because:",
    [
      { id: "a", label: "Oxygen has three domains" },
      { id: "b", label: "Oxygen has four domains including lone pairs" },
      { id: "c", label: "Bent shapes always use sp²" },
      { id: "d", label: "Hydrogen forces sp hybridization" },
    ],
    "b",
    "Hybridization follows electron domains (4), not the molecular (atom-only) shape.",
    {
      a: "electron_vs_molecular_geometry",
      c: "electron_vs_molecular_geometry",
      d: "generic",
    },
    4,
    true,
  ),
  mcq(
    "hyb-q8",
    "In ethene, the π bond primarily arises from:",
    [
      { id: "a", label: "Overlap of two sp² hybrids" },
      { id: "b", label: "Sideways overlap of unhybridized p orbitals" },
      { id: "c", label: "Overlap of 1s orbitals" },
      { id: "d", label: "Ionic attraction between carbons" },
    ],
    "b",
    "sp² hybrids form the σ framework; leftover p orbitals form π.",
    { a: "sp2_without_p_orbital", c: "sigma_vs_pi", d: "generic" },
    4,
    true,
  ),
];

/** Guided prediction steps for a molecule (learning loop). */
export type GuidedStepKind =
  | "electron_geometry"
  | "molecular_geometry"
  | "hybridization"
  | "sigma_pi"
  | "bond_angle";

export function guidedAnswersFor(moleculeId: string) {
  const m = HYBRIDIZATION_MOLECULES.find((x) => x.id === moleculeId);
  if (!m) return null;
  return {
    electron_geometry: m.electronGeometry,
    molecular_geometry: m.molecularGeometry,
    hybridization: m.hybridization,
    sigma: m.sigmaBonds,
    pi: m.piBonds,
    bond_angle: m.approxBondAngleDeg,
  };
}
