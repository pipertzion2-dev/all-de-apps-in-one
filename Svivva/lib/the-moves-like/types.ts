export type MovesLikeScreen =
  | "discover"
  | "learn"
  | "create"
  | "studio"
  | "play"
  | "community"
  | "profile";

export type DanceStyle =
  | "hip-hop"
  | "house"
  | "popping"
  | "locking"
  | "contemporary"
  | "freestyle"
  | "afrobeats"
  | "vogue";

export type SkillLevel = "beginner" | "intermediate" | "advanced" | "pro";

export type EnergyLevel = "low" | "medium" | "high" | "explosive";

export type MusicalMood = "groovy" | "energetic" | "smooth" | "aggressive" | "playful";

export type MoveId = string;

export type DanceMove = {
  id: MoveId;
  name: string;
  style: DanceStyle;
  level: SkillLevel;
  energy: EnergyLevel;
  durationSec: number;
  beats: number;
  tags: string[];
  tutorialSteps: string[];
  /** Seeded illustrative DNA params — not measured tracking data */
  dna: MotionDnaParams;
  /** Optional reference video URL (public demo clips) */
  referenceVideoUrl?: string;
};

export type MotionDnaParams = {
  /** Deterministic seed for procedural sculpture */
  seed: number;
  amplitude: number;
  frequency: number;
  twist: number;
  asymmetry: number;
  jointEmphasis: ("hips" | "shoulders" | "arms" | "legs" | "spine" | "head")[];
  rhythmAccent: number[];
  colorBias: "teal" | "magenta" | "mauve" | "cyan";
  measured: false;
  label: "illustrative";
};

export type TimelineClip = {
  id: string;
  moveId: MoveId;
  startBeat: number;
  durationBeats: number;
};

export type Routine = {
  id: string;
  name: string;
  bpm: number;
  clips: TimelineClip[];
  createdAt: string;
  updatedAt: string;
  /** "manual" | "library-assembled" — never claim AI without a real model */
  origin: "manual" | "library-assembled";
  style?: DanceStyle;
  mood?: MusicalMood;
  energy?: EnergyLevel;
  level?: SkillLevel;
};

export type FavoriteCombo = {
  id: string;
  name: string;
  moveIds: MoveId[];
  createdAt: string;
};

export type StyleClashChallenge = {
  id: string;
  prompt: string;
  moveId: MoveId;
  createdAt: string;
  /** Local-only response recordings as object URLs / metadata */
  responses: StyleClashResponse[];
};

export type StyleClashResponse = {
  id: string;
  authorLabel: string;
  note: string;
  createdAt: string;
  /** Blob URL when recorded in-browser */
  videoObjectUrl?: string;
  votesCreativity: number;
  votesStyle: number;
};

export type PracticeSection = {
  moveId: MoveId;
  loopStartSec: number;
  loopEndSec: number;
};

export type ChoreoBrief = {
  style: DanceStyle;
  level: SkillLevel;
  mood: MusicalMood;
  energy: EnergyLevel;
  durationSec: number;
  preferredMoveIds: MoveId[];
  challenge?: string;
};

export type AudioAnalysisSnapshot = {
  bpm: number | null;
  energy: number;
  bass: number;
  mid: number;
  treble: number;
  waveform: Float32Array;
  beatGrid: number[];
  reliableTempo: boolean;
};

export type PoseLandmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

export type PoseFrame = {
  timestampMs: number;
  landmarks: PoseLandmark[];
  source: "mediapipe" | "none";
};
