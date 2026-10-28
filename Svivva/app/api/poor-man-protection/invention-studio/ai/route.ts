import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getDefaultModel, isAnyAiProviderAvailable, openai } from "@/lib/llm/openai";
import {
  buildAiMessages,
  localAiFallback,
  type AiAssistKind,
} from "@/lib/poor-man-protection/invention-studio/ai";
import {
  INVENTION_CATEGORIES,
  PROTOTYPE_STATUSES,
} from "@/lib/poor-man-protection/invention-studio/types";

export const maxDuration = 90;

const fieldsSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(INVENTION_CATEGORIES),
  inventors: z.array(
    z.object({
      name: z.string(),
      email: z.string().optional(),
      role: z.enum(["sole_inventor", "co_inventor", "assignee", "agent"]),
      contribution: z.string().optional(),
    }),
  ),
  conceptionDate: z.string(),
  problemSolved: z.string(),
  howItWorks: z.string(),
  uniqueFeatures: z.string(),
  technicalSpecs: z.string(),
  materials: z.string(),
  componentsText: z.string(),
  alternativeImplementations: z.string(),
  prototypeStatus: z.enum(PROTOTYPE_STATUSES),
  developmentHistory: z.string(),
  collaborators: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.string(),
      email: z.string().optional(),
      addedAt: z.string(),
    }),
  ),
});

const bodySchema = z.object({
  kind: z.enum([
    "improve_description",
    "clarifying_questions",
    "missing_details",
    "summary",
    "abstract",
    "detailed_description",
    "embodiments",
    "components",
    "claim_concepts",
    "disclosure",
  ]),
  fields: fieldsSchema,
  userNote: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const { error } = await requireUser();
  // Guests may still get deterministic local assist; signed-in gets LLM when available.
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { kind, fields, userNote } = parsed.data;
  const messages = buildAiMessages(kind as AiAssistKind, fields, userNote);

  if (!isAnyAiProviderAvailable()) {
    return NextResponse.json({
      content: localAiFallback(kind as AiAssistKind, fields),
      source: "local_fallback",
      label: "ai_generated",
      notice: "AI provider not configured — offline assistant used. Not evidence.",
      serverTimestamp: new Date().toISOString(),
      signedIn: !error,
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: getDefaultModel(),
      temperature: 0.3,
      messages: [
        { role: "system", content: messages.system },
        { role: "user", content: messages.user },
      ],
    });
    const content =
      completion.choices[0]?.message?.content?.trim() ||
      localAiFallback(kind as AiAssistKind, fields);
    return NextResponse.json({
      content,
      source: "llm",
      label: "ai_generated",
      notice: "AI-generated suggestion — separate from user evidence. Never fabricated as fact.",
      serverTimestamp: new Date().toISOString(),
      signedIn: !error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "AI failed";
    return NextResponse.json({
      content: localAiFallback(kind as AiAssistKind, fields),
      source: "local_fallback",
      label: "ai_generated",
      notice: `LLM error (${message}); offline assistant used.`,
      serverTimestamp: new Date().toISOString(),
      signedIn: !error,
    });
  }
}
