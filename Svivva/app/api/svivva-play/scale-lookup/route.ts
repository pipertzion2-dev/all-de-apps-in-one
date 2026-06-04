import { NextRequest, NextResponse } from "next/server";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { isAnyAiProviderAvailable } from "@/lib/llm/providers";
import {
  applyScaleLookupMatch,
  lookupScaleLocal,
  matchFromAiPayload,
  type ScaleLookupResult,
} from "@/lib/svivva-play/scale-lookup";
import { scaleNoteNames } from "@/lib/svivva-play/reich-engine";
import { parseRootFromKeyLabel } from "@/lib/svivva-play/analysis-utils";

export const runtime = "nodejs";

async function lookupScaleWithAi(
  query: string,
  keyRoot: string,
): Promise<ScaleLookupResult["resolved"]> {
  if (!isAnyAiProviderAvailable()) return null;

  const completion = await openai.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a music-theory scale database. Given a scale name (any spelling, language, or tradition), return JSON only: {\"scaleId\":\"snake_case_id\",\"relativeSemitoneSteps\":[0,2,4,...],\"displayName\":\"Human Name\",\"reason\":\"one sentence\"}. relativeSemitoneSteps are semitone offsets from the root within one octave (unique, sorted, at least 5 for heptatonic). Use established interval patterns (e.g. Brazilian → mixolydian-like or regional pentatonics).",
      },
      { role: "user", content: `Scale query: "${query}"` },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      scaleId?: string;
      relativeSemitoneSteps?: number[];
      displayName?: string;
      reason?: string;
    };
    const match = matchFromAiPayload(parsed);
    if (!match) return null;
    match.noteNames = scaleNoteNames(match.scaleId, keyRoot);
    applyScaleLookupMatch(match);
    return match;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      query?: string;
      key?: string;
      useAi?: boolean;
    };
    const query = String(body.query ?? "").trim();
    if (!query) {
      return NextResponse.json({ error: "query required" }, { status: 400 });
    }

    const keyRoot = parseRootFromKeyLabel(body.key ?? "C major");
    let result = lookupScaleLocal(query, keyRoot);

    if (!result.resolved && (body.useAi !== false)) {
      const aiMatch = await lookupScaleWithAi(query, keyRoot);
      if (aiMatch) {
        result = {
          query,
          resolved: aiMatch,
          suggestions: result.suggestions,
        };
      }
    }

    if (result.resolved) {
      applyScaleLookupMatch(result.resolved);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Scale lookup error:", error);
    return NextResponse.json({ error: "Scale lookup failed" }, { status: 500 });
  }
}
