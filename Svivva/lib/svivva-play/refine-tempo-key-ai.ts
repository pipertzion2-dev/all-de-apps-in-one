import { openai, getPlayModelChain, isAnyAiProviderAvailable } from "@/lib/llm/openai";
import type { DetectionMeta, TempoCandidate, KeyCandidate } from "./tempo-key-core";

export interface RefinedDetection {
  bpm: number;
  key: string;
  keyConfidence: number;
  bpmConfidence: number;
  source: "ai" | "dsp";
  reason?: string;
}

function summarizeCandidates(meta: DetectionMeta): string {
  const bpmLines = meta.bpmCandidates
    .slice(0, 8)
    .map((c) => `  - ${c.bpm} BPM (${c.source}, weight ${c.weight.toFixed(2)})`)
    .join("\n");
  const keyLines = meta.keyCandidates
    .slice(0, 6)
    .map((c) => `  - ${c.key} (${c.source}, conf ${c.confidence}%)`)
    .join("\n");
  return `BPM candidates:\n${bpmLines || "  (none)"}\nKey candidates:\n${keyLines || "  (none)"}`;
}

export async function refineTempoKeyWithAI(
  dspResult: { bpm: number; key: string; keyConfidence: number; bpmConfidence?: number },
  meta: DetectionMeta,
  audioMeta?: { name?: string; durationSec?: number; type?: string },
): Promise<RefinedDetection> {
  const fallback: RefinedDetection = {
    bpm: dspResult.bpm,
    key: dspResult.key,
    keyConfidence: dspResult.keyConfidence,
    bpmConfidence: dspResult.bpmConfidence ?? dspResult.keyConfidence,
    source: "dsp",
  };

  if (!isAnyAiProviderAvailable()) return fallback;

  const systemPrompt = `You are an expert musicologist and audio engineer specializing in tempo and key detection.
Multiple DSP algorithms (peak histogram, autocorrelation, web-audio-beat-detector, beat-grid search, Krumhansl-Schmuckler key profiles) have analyzed a track.

Your job: pick the TRUE tempo and key. Critical rules:
- Half/double tempo errors are extremely common (60 vs 120, 70 vs 140). Prefer the tempo where onsets align to a musical pulse, typically 80–160 BPM for pop/rock/electronic/hip-hop.
- If one detector says 60 and another says 120, strongly prefer 120 unless the track is ballad/slow jazz.
- Key must be "X major" or "X minor" with standard note names (C, C#, D, etc.).
- Return ONLY valid JSON, no markdown.`;

  const userPrompt = `File: ${audioMeta?.name ?? "unknown"} (${audioMeta?.type ?? "audio"}, ${audioMeta?.durationSec?.toFixed(1) ?? "?"}s)

${summarizeCandidates(meta)}

DSP fusion picked: ${dspResult.bpm} BPM, ${dspResult.key} (${dspResult.keyConfidence}% key confidence)

Return JSON:
{
  "bpm": <integer 40-220>,
  "key": "<note> major|minor",
  "bpm_confidence": <0-99>,
  "key_confidence": <0-99>,
  "reason": "<one short sentence>"
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
          temperature: 0.2,
          response_format: { type: "json_object" },
        },
        { timeout: 15000 },
      );

      const raw = completion.choices[0].message.content || "{}";
      const parsed = JSON.parse(raw) as {
        bpm?: number;
        key?: string;
        bpm_confidence?: number;
        key_confidence?: number;
        reason?: string;
      };

      const bpm = Math.round(parsed.bpm ?? dspResult.bpm);
      const key = String(parsed.key ?? dspResult.key).trim();
      if (bpm < 40 || bpm > 220 || !key) continue;

      return {
        bpm,
        key,
        keyConfidence: Math.min(
          99,
          Math.max(25, Math.round(parsed.key_confidence ?? dspResult.keyConfidence)),
        ),
        bpmConfidence: Math.min(99, Math.max(25, Math.round(parsed.bpm_confidence ?? 70))),
        source: "ai",
        reason: parsed.reason,
      };
    } catch (err) {
      console.warn(`AI tempo/key refinement failed on ${model}:`, err);
    }
  }

  return fallback;
}

export function mergeDetectionMeta(a?: DetectionMeta, b?: DetectionMeta): DetectionMeta {
  const bpmCandidates: TempoCandidate[] = [
    ...(a?.bpmCandidates ?? []),
    ...(b?.bpmCandidates ?? []),
  ];
  const keyCandidates: KeyCandidate[] = [...(a?.keyCandidates ?? []), ...(b?.keyCandidates ?? [])];
  return {
    bpmCandidates,
    keyCandidates,
    durationSec: a?.durationSec ?? b?.durationSec,
  };
}
