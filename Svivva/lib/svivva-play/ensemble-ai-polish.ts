import { openai, getPlayModelChain, isAnyAiProviderAvailable } from "@/lib/llm/openai";
import type { NormalizedMidiEvent } from "./midi-normalize";

type PolishStem = {
  name: string;
  role: string;
  instrumentHint?: string;
  midiEvents: NormalizedMidiEvent[];
};

export type EnsemblePolishResult<T extends PolishStem = PolishStem> = {
  stems: T[];
  aiApplied: boolean;
  notes?: string;
};

class Rng {
  private state: number;
  constructor(seed: number) {
    this.state = seed || 1;
  }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }
}

/** Theory-aware micro-timing and velocity breathing (always runs). */
export function applyEnsembleHumanization<T extends PolishStem>(
  stems: T[],
  bpm: number,
  seed: number,
): T[] {
  const rng = new Rng(seed ^ 0x51ab);
  const grid = bpm >= 120 ? 0.083 : 0.125;

  return stems.map((stem) => {
    const isPerc =
      stem.role === "percussion" ||
      /cymbal|triangle|cabasa|timpani/i.test(stem.name);
    const events = [...stem.midiEvents]
      .sort((a, b) => a.startBeat - b.startBeat)
      .map((evt, idx) => {
        const barPos = evt.startBeat % 4;
        const syncopated = barPos > 0.1 && barPos < 3.9 && Math.abs(barPos - Math.round(barPos)) > 0.05;
        let startBeat = evt.startBeat;
        if (syncopated && !isPerc) {
          const nudge = (rng.next() - 0.5) * grid * 0.6;
          startBeat = Math.max(0, startBeat + nudge);
        } else if (isPerc) {
          startBeat = Math.round(startBeat / grid) * grid;
        }

        let velocity = evt.velocity;
        if (!isPerc) {
          const swell = Math.sin((idx / Math.max(1, stem.midiEvents.length)) * Math.PI) * 4;
          const ghost = syncopated && rng.next() < 0.12 ? -9 : 0;
          velocity = Math.round(Math.min(118, Math.max(28, velocity + swell + ghost)));
        }

        return { ...evt, startBeat, velocity };
      });
    return { ...stem, midiEvents: events };
  });
}

export async function polishEnsembleStemsWithAi<T extends PolishStem>(
  stems: T[],
  options: { key: string; bpm: number; scaleName: string; seed: number },
): Promise<EnsemblePolishResult<T>> {
  let polished = applyEnsembleHumanization(stems, options.bpm, options.seed);

  if (!isAnyAiProviderAvailable() || stems.length === 0) {
    return { stems: polished, aiApplied: false };
  }

  const summary = polished.map((s) => ({
    name: s.name,
    role: s.role,
    notes: s.midiEvents.length,
    avgVel:
      s.midiEvents.length > 0
        ? Math.round(
            s.midiEvents.reduce((a, e) => a + e.velocity, 0) / s.midiEvents.length,
          )
        : 0,
  }));

  const systemPrompt = `You are a Juilliard-trained orchestrator polishing a procedural ensemble sketch.
Return ONLY JSON. Suggest subtle mix/humanization — never change pitch classes or key.
Keep registers warm (avoid piercing high violin/flute peaks). Favor syncopation and phrase breathing.`;

  const userPrompt = `Key: ${options.key}, scale: ${options.scaleName}, ${options.bpm} BPM.
Stems: ${JSON.stringify(summary)}

Return:
{
  "velocityTrimHigh": <0-8, reduce piercing highs>,
  "syncopationBoost": <0.0-0.15, extra ghost-note probability>,
  "notes": "<one sentence orchestration note>"
}`;

  for (const model of getPlayModelChain()) {
    try {
      const completion = await openai.chat.completions.create(
        {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.35,
          response_format: { type: "json_object" },
        },
        { timeout: 12000 },
      );
      const raw = completion.choices[0].message.content || "{}";
      const parsed = JSON.parse(raw) as {
        velocityTrimHigh?: number;
        syncopationBoost?: number;
        notes?: string;
      };
      const trim = Math.max(0, Math.min(8, Number(parsed.velocityTrimHigh ?? 3)));
      const boost = Math.max(0, Math.min(0.15, Number(parsed.syncopationBoost ?? 0.05)));
      const rng = new Rng(options.seed ^ 0xa101);

      polished = polished.map((stem) => {
        if (stem.role === "percussion") return stem;
        const isHigh =
          /violin|flute|oboe|solo/i.test(stem.name) || stem.role === "melody";
        return {
          ...stem,
          midiEvents: stem.midiEvents.map((evt) => {
            let velocity = evt.velocity;
            if (isHigh && evt.note >= 67) velocity -= trim;
            if (boost > 0 && rng.next() < boost) velocity = Math.max(28, velocity - 6);
            return { ...evt, velocity: Math.round(velocity) };
          }),
        };
      });

      return { stems: polished, aiApplied: true, notes: parsed.notes };
    } catch {
      continue;
    }
  }

  return { stems: polished, aiApplied: false };
}
