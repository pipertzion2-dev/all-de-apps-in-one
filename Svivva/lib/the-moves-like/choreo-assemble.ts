import { filterMoves, getMove } from "./moves-library";
import type { ChoreoBrief, Routine, TimelineClip } from "./types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Assembles a routine from the movement library using deterministic filters.
 * Labeled `library-assembled` — NOT AI-generated choreography.
 */
export function assembleFromLibrary(brief: ChoreoBrief): Routine {
  const preferred = brief.preferredMoveIds
    .map((id) => getMove(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  let pool = filterMoves({
    style: brief.style,
    level: brief.level === "pro" ? "advanced" : brief.level,
    energy: brief.energy,
  });

  if (pool.length < 3) {
    pool = filterMoves({ style: brief.style });
  }
  if (pool.length < 3) {
    pool = filterMoves({});
  }

  // Prefer preferred moves first, then fill from pool
  const ordered = [...preferred, ...pool.filter((m) => !preferred.some((p) => p.id === m.id))];

  const targetBeats = Math.max(8, Math.round((brief.durationSec / 60) * 120));
  const clips: TimelineClip[] = [];
  let beat = 0;
  let i = 0;

  while (beat < targetBeats && ordered.length > 0) {
    const move = ordered[i % ordered.length]!;
    const durationBeats = Math.max(2, move.beats);
    clips.push({
      id: uid("clip"),
      moveId: move.id,
      startBeat: beat,
      durationBeats,
    });
    beat += durationBeats;
    i += 1;
    // Mild challenge: insert a harder move every 3rd clip when requested
    if (brief.challenge && i % 3 === 0) {
      const hard = pool.find((m) => m.level === "advanced" || m.energy === "explosive");
      if (hard && hard.id !== move.id) {
        clips.push({
          id: uid("clip"),
          moveId: hard.id,
          startBeat: beat,
          durationBeats: hard.beats,
        });
        beat += hard.beats;
      }
    }
  }

  const now = new Date().toISOString();
  return {
    id: uid("routine"),
    name: `${brief.style} · ${brief.mood} · ${brief.durationSec}s`,
    bpm: 120,
    clips,
    createdAt: now,
    updatedAt: now,
    origin: "library-assembled",
    style: brief.style,
    mood: brief.mood,
    energy: brief.energy,
    level: brief.level,
  };
}

/** Optional OpenAI-assisted sequencing when OPENAI is wired client-side via API route. */
export type AiChoreoStatus =
  | { available: false; reason: string }
  | { available: true; note: string };

export function aiChoreographyStatus(): AiChoreoStatus {
  return {
    available: false,
    reason:
      "No dedicated movement-generation model is connected. Use library-assembled sequences from the Move Reactor brief, or build manually on the timeline.",
  };
}
