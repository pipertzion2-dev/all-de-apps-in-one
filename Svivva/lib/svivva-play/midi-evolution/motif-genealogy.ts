import type { BassPatternRecord, MotifKind, MotifRecord, PhraseRecord } from "./types";
import type { ImportedMidiTrack } from "./types";

function intervalsFromEvents(events: ImportedMidiTrack["events"]): number[] {
  const mono = [...events].sort((a, b) => a.startBeat - b.startBeat);
  const out: number[] = [];
  for (let i = 1; i < mono.length; i++) {
    out.push(mono[i]!.note - mono[i - 1]!.note);
  }
  return out;
}

function rhythmFromEvents(events: ImportedMidiTrack["events"]): number[] {
  const mono = [...events].sort((a, b) => a.startBeat - b.startBeat);
  const out: number[] = [];
  for (let i = 1; i < mono.length; i++) {
    out.push(Number((mono[i]!.startBeat - mono[i - 1]!.startBeat).toFixed(3)));
  }
  return out.slice(0, 8);
}

function ngrams<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i <= arr.length - n; i++) out.push(arr.slice(i, i + n));
  return out;
}

function patternKey(pattern: number[]): string {
  return pattern.map((v) => v.toFixed(2)).join(",");
}

function classifyMotif(index: number, total: number): MotifKind {
  if (index === 0) return "primary";
  if (index < Math.ceil(total * 0.35)) return "secondary";
  if (index < Math.ceil(total * 0.7)) return "transition";
  return "hidden";
}

function registerFromMean(mean: number): MotifRecord["register"] {
  if (mean < 52) return "low";
  if (mean > 66) return "high";
  return "mid";
}

/** Discover motifs across all tracks and build genealogy links. */
export function buildMotifGenealogy(
  tracks: ImportedMidiTrack[],
  phrases: PhraseRecord[],
): {
  motifs: MotifRecord[];
  genealogy: { parentId: string; childId: string }[];
  rhythms: { id: string; pattern: number[]; motifId?: string }[];
  bassPatterns: BassPatternRecord[];
} {
  const motifMap = new Map<string, MotifRecord>();
  const bassPatterns: BassPatternRecord[] = [];

  for (const track of tracks) {
    const intervals = intervalsFromEvents(track.events);
    const grams = ngrams(intervals, 3);
    for (const g of grams) {
      const key = patternKey(g);
      const existing = motifMap.get(key);
      if (existing) {
        existing.occurrences += 1;
        if (!existing.sourceFileIds.includes(track.id)) existing.sourceFileIds.push(track.id);
      } else {
        const mean =
          track.events.reduce((s, e) => s + e.note, 0) / Math.max(1, track.events.length);
        motifMap.set(key, {
          id: `motif_${motifMap.size + 1}`,
          kind: "hidden",
          sourceFileIds: [track.id],
          intervalPattern: g,
          rhythmPattern: rhythmFromEvents(track.events),
          register: registerFromMean(mean),
          occurrences: 1,
          childIds: [],
        });
      }
    }

    if (track.role === "bass" || track.events.every((e) => e.note < 55)) {
      bassPatterns.push({
        id: `bass_${track.id}`,
        sourceFileId: track.id,
        intervals: intervals.slice(0, 12),
        register: track.events.reduce((s, e) => s + e.note, 0) / Math.max(1, track.events.length),
      });
    }
  }

  const motifs = [...motifMap.values()]
    .sort((a, b) => b.occurrences - a.occurrences)
    .map((m, i) => ({ ...m, kind: classifyMotif(i, motifMap.size) }));

  const primary = motifs.find((m) => m.kind === "primary");
  const genealogy: { parentId: string; childId: string }[] = [];
  if (primary) {
    for (const m of motifs) {
      if (m.id === primary.id) continue;
      const overlap = m.intervalPattern.filter((v, i) => v === primary.intervalPattern[i]).length;
      if (overlap >= 1) {
        m.parentId = primary.id;
        primary.childIds.push(m.id);
        genealogy.push({ parentId: primary.id, childId: m.id });
      }
    }
  }

  const rhythms = motifs.map((m) => ({
    id: `rhythm_${m.id}`,
    pattern: m.rhythmPattern,
    motifId: m.id,
  }));

  if (primary && motifs.length > 1) {
    const variants: { suffix: string; pattern: number[] }[] = [
      { suffix: "_inv", pattern: primary.intervalPattern.map((v) => -v) },
      { suffix: "_frag", pattern: primary.intervalPattern.slice(0, 2) },
      { suffix: "_exp", pattern: [...primary.intervalPattern, primary.intervalPattern[0] ?? 0] },
    ];
    for (const v of variants) {
      const childId = `${primary.id}${v.suffix}`;
      motifs.push({
        id: childId,
        kind: "hidden",
        sourceFileIds: [...primary.sourceFileIds],
        intervalPattern: v.pattern,
        rhythmPattern: primary.rhythmPattern,
        register: primary.register,
        occurrences: 1,
        parentId: primary.id,
        childIds: [],
      });
      primary.childIds.push(childId);
      genealogy.push({ parentId: primary.id, childId });
    }
  }

  void phrases;
  return { motifs, genealogy, rhythms, bassPatterns };
}

export function pickMotifFamily(memory: MotifRecord[], seedId?: string): MotifRecord[] {
  if (!memory.length) return [];
  const root = seedId
    ? memory.find((m) => m.id === seedId)
    : memory.find((m) => m.kind === "primary");
  if (!root) return memory.slice(0, 4);
  const family = new Set<string>([root.id, ...root.childIds]);
  return memory.filter((m) => family.has(m.id));
}
