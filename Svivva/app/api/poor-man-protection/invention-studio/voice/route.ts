import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getDefaultModel, isAnyAiProviderAvailable, openai } from "@/lib/llm/openai";
import { structureVoiceJournal } from "@/lib/poor-man-protection/invention-studio/memory-graph";

const bodySchema = z.object({
  inventionId: z.string(),
  transcript: z.string().min(3).max(20_000),
  source: z.enum(["web_speech", "whisper_api", "typed_fallback"]).default("typed_fallback"),
});

export async function POST(req: NextRequest) {
  await requireUser();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid voice journal request" }, { status: 400 });
  }

  let draft = structureVoiceJournal(
    parsed.data.inventionId,
    parsed.data.transcript,
    parsed.data.source,
  );

  if (isAnyAiProviderAvailable()) {
    try {
      const completion = await openai.chat.completions.create({
        model: getDefaultModel(),
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Structure a voice invention journal entry. Return JSON {title, body, suggestedMilestone, relatedComponentHints:string[]}. Do not invent facts beyond the transcript. Do not alter meaning.",
          },
          { role: "user", content: parsed.data.transcript },
        ],
      });
      const raw = completion.choices[0]?.message?.content || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]) as {
          title?: string;
          body?: string;
          suggestedMilestone?: string;
          relatedComponentHints?: string[];
        };
        draft = {
          ...draft,
          structuredTitle: data.title?.trim() || draft.structuredTitle,
          structuredBody: data.body?.trim() || draft.structuredBody,
          suggestedMilestone: data.suggestedMilestone || draft.suggestedMilestone,
          relatedComponentHints: data.relatedComponentHints?.length
            ? data.relatedComponentHints
            : draft.relatedComponentHints,
        };
      }
    } catch {
      /* keep deterministic structure */
    }
  }

  return NextResponse.json({
    draft,
    notice:
      "AI structured this draft for confirmation only. Historical records are never silently altered. Confirm before saving.",
    serverTimestamp: new Date().toISOString(),
  });
}