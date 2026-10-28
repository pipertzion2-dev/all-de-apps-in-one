import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getDefaultModel, isAnyAiProviderAvailable, openai } from "@/lib/llm/openai";
import {
  buildReadinessPrompt,
  runReadinessAuditLocal,
} from "@/lib/poor-man-protection/invention-studio/readiness-auditor";
import type { InventionBundle, ReadinessIssue } from "@/lib/poor-man-protection/invention-studio/types";

export const maxDuration = 90;

const bodySchema = z.object({
  bundle: z.custom<InventionBundle>(),
  enrichWithLlm: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  await requireUser();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success || !parsed.data.bundle?.invention?.id) {
    return NextResponse.json({ error: "Invalid readiness request" }, { status: 400 });
  }

  const audit = runReadinessAuditLocal(parsed.data.bundle);
  audit.serverTimestamp = new Date().toISOString();

  if (parsed.data.enrichWithLlm !== false && isAnyAiProviderAvailable()) {
    try {
      const completion = await openai.chat.completions.create({
        model: getDefaultModel(),
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "You are Cube Protect Patent-Readiness Auditor. Only identify documentation gaps from user text. Never invent facts. Never claim patentability. JSON only.",
          },
          { role: "user", content: buildReadinessPrompt(parsed.data.bundle) },
        ],
      });
      const raw = completion.choices[0]?.message?.content || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const extra = JSON.parse(match[0]) as { issues?: Array<Partial<ReadinessIssue>> };
        for (const issue of extra.issues || []) {
          if (!issue.title || !issue.detail) continue;
          audit.issues.push({
            id: `iss_llm_${crypto.randomUUID().slice(0, 8)}`,
            severity: (issue.severity as ReadinessIssue["severity"]) || "suggested",
            category: (issue.category as ReadinessIssue["category"]) || "description",
            title: String(issue.title),
            detail: `${issue.detail} [AI-assisted gap analysis — not evidence]`,
            followUpQuestion: issue.followUpQuestion,
            suggestedAction: issue.suggestedAction || "Review and fill with user-provided facts.",
            resolved: false,
          });
        }
      }
    } catch {
      /* keep deterministic audit */
    }
  }

  return NextResponse.json({ audit });
}
