import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { Analysis } from "./schemas";
import { generateNeoSoulChords, getProgressionLabels, type ChordStem } from "./chord-engine";
import { normalizeMidiEvents } from "./midi-normalize";
import { constrainGeneratedStems } from "./scale-key-guard";
import type { ChordSegment } from "./chord-from-chroma";

type CompPattern = "sustained_pads" | "rhythmic_stabs" | "arpeggiated";

export interface GeneratedStemResult {
  id: string;
  name: string;
  role: string;
  register: string;
  instrumentHint: string;
  muted: boolean;
  soloed: boolean;
  pan: number;
  gainDb: number;
  midiEvents: ReturnType<typeof normalizeMidiEvents>;
  expression: Record<string, unknown>;
  articulations: string[];
  qualityTier: string;
}

export function chordStemsToResults(
  chordStems: ChordStem[],
  lock?: { key: string; chords?: ChordSegment[]; bpm?: number },
): GeneratedStemResult[] {
  const results = chordStems.map((stem) => ({
    id: uuidv4(),
    name: stem.name,
    role: stem.role,
    register: stem.role === "bass" ? "low" : "mid",
    instrumentHint: stem.instrumentHint,
    muted: stem.muted ?? false,
    soloed: stem.soloed ?? false,
    pan: stem.pan,
    gainDb: stem.gainDb,
    midiEvents: normalizeMidiEvents(stem.midiEvents),
    expression: {},
    articulations: [],
    qualityTier: "professional",
  }));
  if (!lock?.key) return results;
  return constrainGeneratedStems(results, lock.key, lock.chords ?? [], lock.bpm ?? 120);
}

export function generateDeterministicChordStems(
  analysis: Analysis,
  quality: "preview" | "full",
  seed: number,
  pattern: CompPattern = "sustained_pads",
) {
  const progressionSeed = seed % 5;
  const totalBars = quality === "full" ? 16 : 8;
  const chordStems = generateNeoSoulChords({
    key: analysis.key,
    bpm: analysis.bpm,
    barsPerChord: 2,
    totalBars,
    pattern,
    progressionSeed,
    includeBass: true,
  });
  const chordNames = getProgressionLabels(analysis.key, progressionSeed);
  return {
    stems: chordStemsToResults(chordStems, {
      key: analysis.key,
      bpm: analysis.bpm,
    }),
    plan: {
      stemCount: chordStems.length,
      chordProgression: chordNames,
      key: analysis.key,
      bpm: analysis.bpm,
      form: { total_bars: totalBars },
      harmonyRules: `Neo-soul voicings in ${analysis.key} (Glasper/Lins style)`,
      meendApplicableStems: [] as string[],
    },
    pipeline: { stage: "complete", stages: ["chord_engine"] },
  };
}

export async function persistGenerationBundle(
  db: typeof import("@/lib/db").db,
  playGenerations: typeof import("@/lib/schema").playGenerations,
  playStems: typeof import("@/lib/schema").playStems,
  opts: {
    generationId: string;
    sessionId: string;
    mode: string;
    quality: string;
    seed: number;
    stems: GeneratedStemResult[];
    plan: Record<string, unknown>;
  },
): Promise<void> {
  const { generationId, sessionId, mode, quality, seed, stems, plan } = opts;

  await db.insert(playGenerations).values({
    id: generationId,
    sessionId,
    mode,
    status: "generating_midi",
    renderQuality: quality,
    seed,
  });

  for (const stem of stems) {
    await db.insert(playStems).values({
      id: stem.id,
      generationId,
      name: stem.name,
      role: stem.role,
      instrumentHint: stem.instrumentHint,
      midiEvents: stem.midiEvents as unknown[],
      expression: stem.expression as any,
      pan: stem.pan,
      gainDb: stem.gainDb,
      muted: stem.muted,
      soloed: stem.soloed,
    });
  }

  await db
    .update(playGenerations)
    .set({
      status: "complete",
      plan: plan as Record<string, unknown>,
      midiData: { stems } as Record<string, unknown>,
      completedAt: new Date(),
    })
    .where(eq(playGenerations.id, generationId));
}
