/**
 * AP Science concept data model — reusable across Chem / Physics / Bio.
 * Scientific models stay separate from React rendering and assessment UI.
 */

export type ApSubject = "ap-chemistry" | "ap-physics" | "ap-biology";

export type ApConcept = {
  id: string;
  subject: ApSubject;
  unit: string;
  topic: string;
  title: string;
  prerequisites: string[];
  learningObjectives: string[];
  explanation: string;
  vocabulary: { term: string; definition: string }[];
  misconceptions: string[];
  equations?: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  masteryCriteria: {
    minCorrect: number;
    minAccuracy: number;
    requireTransfer?: boolean;
  };
  relatedConcepts: string[];
  visualizationId?: string;
};

export type Confidence = "low" | "medium" | "high";

export type MisconceptionTag =
  | "electron_vs_molecular_geometry"
  | "double_bond_as_two_domains"
  | "sp2_without_p_orbital"
  | "sigma_vs_pi"
  | "velocity_vs_acceleration"
  | "motion_requires_force"
  | "diffusion_stops_at_eq"
  | "transcription_vs_translation"
  | "generic";

export type ApQuestionType =
  | "multiple_choice"
  | "quantitative"
  | "diagram"
  | "graph"
  | "prediction"
  | "explanation"
  | "multi_step";

export type ApQuestion = {
  id: string;
  conceptId: string;
  type: ApQuestionType;
  prompt: string;
  choices?: { id: string; label: string }[];
  correctChoiceId?: string;
  correctNumeric?: number;
  tolerance?: number;
  /** Maps wrong choice → misconception */
  misconceptionByChoice?: Record<string, MisconceptionTag>;
  explanation: string;
  transfer?: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export type AttemptRecord = {
  questionId: string;
  conceptId: string;
  correct: boolean;
  confidence: Confidence;
  misconception?: MisconceptionTag;
  usedHint: boolean;
  responseMs: number;
  at: string;
};

export type ConceptMastery = {
  conceptId: string;
  score: number; // 0–100
  attempts: number;
  correct: number;
  confidenceWrong: number;
  lastMisconception?: MisconceptionTag;
  updatedAt: string;
};
