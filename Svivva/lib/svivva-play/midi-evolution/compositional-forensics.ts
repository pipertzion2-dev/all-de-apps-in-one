import type { CompositionMemory, ImportedMidiTrack, MotifKind, PhraseRecord } from "./types";
import { extractRhythmicFingerprint } from "./rhythmic-dna";
import { mergeTracksToEvents } from "./analyze-composition";

export type ForensicsReport = {
  analyzedAt: string;
  fileCount: number;
  globalRelationships: string[];
  motifsByKind: Record<MotifKind, number>;
  recurringPhraseLengths: number[];
  recurringRhythms: number[];
  recurringIntervals: number[];
  tensionPoints: { beat: number; score: number }[];
  releasePoints: { beat: number; score: number }[];
  bassMovements: string[];
  melodicContours: string[];
  harmonicTendencies: string[];
  relationshipMap: { from: string; to: string; relation: string }[];
  rhythmicFingerprint: ReturnType<typeof extractRhythmicFingerprint>;
  narrativeSummary: string;
};

function topPatterns(values: number[], limit = 5): number[] {
  const counts = new Map<number, number>();
  for (const v of values) {
    const key = Math.round(v * 100) / 100;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}

export function runCompositionalForensics(
  tracks: ImportedMidiTrack[],
  memory: CompositionMemory,
  phrases: PhraseRecord[],
): ForensicsReport {
  const allEvents = mergeTracksToEvents(tracks);
  const rhythmicFingerprint = extractRhythmicFingerprint(allEvents);

  const motifsByKind: Record<MotifKind, number> = {
    primary: 0,
    secondary: 0,
    transition: 0,
    hidden: 0,
  };
  for (const m of memory.motifs) motifsByKind[m.kind]++;

  const recurringIntervals = topPatterns(
    memory.motifs.flatMap((m) => m.intervalPattern),
    8,
  );
  const recurringRhythms = topPatterns(
    memory.rhythms.flatMap((r) => r.pattern),
    8,
  );
  const recurringPhraseLengths = topPatterns(
    phrases.map((p) => p.endBeat - p.startBeat),
    6,
  );

  const tensionPoints = phrases
    .filter((p) => p.tension > 0.55)
    .map((p) => ({ beat: p.startBeat, score: p.tension }))
    .slice(0, 12);

  const releasePoints = phrases
    .filter((p) => p.release > 0.5)
    .map((p) => ({ beat: p.endBeat, score: p.release }))
    .slice(0, 12);

  const bassMovements = memory.bassPatterns
    .slice(0, 6)
    .map((b) => b.intervals.slice(0, 4).join("→"));

  const melodicContours = memory.motifs
    .slice(0, 6)
    .map((m) => `${m.kind}: ${m.intervalPattern.join(",")}`);

  const harmonicTendencies = memory.harmonicCenters.slice(0, 10).map((h) => h.symbol);

  const relationshipMap = [
    ...memory.motifGenealogy.map((g) => ({
      from: g.parentId,
      to: g.childId,
      relation: "parent→child",
    })),
    ...memory.phraseRelationships.map((p) => ({
      from: p.fromPhraseId,
      to: p.toPhraseId,
      relation: p.relation,
    })),
  ].slice(0, 24);

  const globalRelationships: string[] = [];
  if (tracks.length > 1) {
    globalRelationships.push(
      `${tracks.length} MIDI files analyzed as one compositional graph (not independent).`,
    );
    const sharedMotifs = memory.motifs.filter((m) => m.sourceFileIds.length > 1);
    if (sharedMotifs.length) {
      globalRelationships.push(
        `${sharedMotifs.length} motifs recur across multiple uploaded files.`,
      );
    }
  }

  const narrativeSummary =
    `Forensics complete: ${memory.motifs.length} motifs ` +
    `(${motifsByKind.primary} primary, ${motifsByKind.secondary} secondary, ` +
    `${motifsByKind.transition} transition, ${motifsByKind.hidden} hidden). ` +
    `Key ${memory.key} @ ${memory.globalBpm} BPM. ` +
    `Ready for long-form sections B–J with rhythmic DNA preserved at 70–90%.`;

  return {
    analyzedAt: new Date().toISOString(),
    fileCount: tracks.length,
    globalRelationships,
    motifsByKind,
    recurringPhraseLengths,
    recurringRhythms,
    recurringIntervals,
    tensionPoints,
    releasePoints,
    bassMovements,
    melodicContours,
    harmonicTendencies,
    relationshipMap,
    rhythmicFingerprint,
    narrativeSummary,
  };
}
