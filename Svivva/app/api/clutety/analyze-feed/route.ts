import { NextRequest, NextResponse } from "next/server";
import { analyzeFeedItem } from "@/lib/clutety/feed-shield-engine";
import type { FeedItemInput, FeedShieldRules } from "@/lib/clutety/feed-shield-types";
import { getGeminiApiKey, getOllamaUrl, getOpenAIApiKey } from "@/lib/env";
import { openai, getDefaultModel } from "@/lib/llm/openai";

export const dynamic = "force-dynamic";

function canDeepAnalyze(): boolean {
  return !!(getGeminiApiKey()?.trim() || getOllamaUrl()?.trim() || getOpenAIApiKey()?.trim());
}

type Body = {
  item: FeedItemInput;
  rules: FeedShieldRules;
  /** Optional: ask LLM to double-check transcript-heavy items */
  deepAnalyze?: boolean;
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.item?.platform || !body.rules) {
    return NextResponse.json({ error: "item and rules are required" }, { status: 400 });
  }

  const heuristic = analyzeFeedItem(body.item, body.rules);

  if (
    body.deepAnalyze &&
    canDeepAnalyze() &&
    heuristic.action === "allow" &&
    (body.item.transcript?.length ?? 0) > 80
  ) {
    try {
      const people = body.rules.blockedPeople
        .filter((p) => p.blockAllMentions)
        .map((p) => `${p.displayName} (${p.aliases.join(", ")})`)
        .join("; ");
      const keywords = body.rules.keywords.join(", ");
      const prompt = `You are Svivva Feed Shield. Decide if this social feed item should be HIDDEN from the user.

Blocked people (hide all news/mentions): ${people || "none"}
Blocked keywords: ${keywords || "none"}
Platform: ${body.item.platform}
Title: ${body.item.title ?? ""}
Description: ${body.item.description ?? ""}
Channel: ${body.item.channel ?? ""}
Transcript excerpt: ${(body.item.transcript ?? "").slice(0, 4000)}

Reply JSON only: {"action":"block"|"allow","confidence":0-1,"reasons":["..."],"matchedTerms":["..."]}`;

      const completion = await openai.chat.completions.create({
        model: getDefaultModel(),
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const ai = JSON.parse(raw) as {
        action?: string;
        confidence?: number;
        reasons?: string[];
        matchedTerms?: string[];
      };

      if (ai.action === "block") {
        return NextResponse.json({
          ...heuristic,
          action: "block",
          confidence: Math.max(heuristic.confidence, ai.confidence ?? 0.8),
          reasons: [
            ...(ai.reasons ?? ["AI transcript/metadata analysis"]),
            ...heuristic.reasons,
          ].slice(0, 8),
          matches: [
            ...heuristic.matches,
            ...(ai.matchedTerms ?? []).map((t) => ({
              type: "keyword" as const,
              label: t,
              snippet: "AI-detected",
            })),
          ],
          aiAssisted: true,
        });
      }
    } catch {
      /* fall through to heuristic */
    }
  }

  return NextResponse.json({ ...heuristic, aiAssisted: false });
}
