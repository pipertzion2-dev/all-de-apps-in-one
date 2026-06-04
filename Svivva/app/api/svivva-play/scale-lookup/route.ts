import { NextRequest, NextResponse } from "next/server";
import { getOllamaApiBase } from "@/lib/env";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { isAnyAiProviderAvailable } from "@/lib/llm/providers";
import {
  applyScaleLookupMatch,
  lookupScaleLocal,
  matchFromAiPayload,
  type ScaleLookupResult,
} from "@/lib/svivva-play/scale-lookup";
import { lookupScaleWithOllama } from "@/lib/svivva-play/scale-lookup-ollama";
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
            'You are a music-theory scale database (V-1 JAWN style). Return JSON: {"scaleId":"snake_case","relativeSemitoneSteps":[0,2,...],"displayName":"Name","confidence":0.9,"alternates":[{"name":"...","intervals":[...]}],"reason":"..."}.',
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
      alternates?: { name?: string; intervals?: number[] }[];
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
      const ollamaHit = getOllamaApiBase()
        ? await lookupScaleWithOllama(query, keyRoot)
        : null;
      if (ollamaHit?.resolved) {
        result = {
          query,
          resolved: ollamaHit.resolved,
          suggestions: result.suggestions,
          alternates: ollamaHit.alternates,
        };
      } else {
        const aiMatch = await lookupScaleWithAi(query, keyRoot);
        if (aiMatch) {
          result = {
            query,
            resolved: aiMatch,
            suggestions: result.suggestions,
          };
        }
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
