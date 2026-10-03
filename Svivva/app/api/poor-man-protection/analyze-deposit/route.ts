import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canUseHybridizationEngine } from "@/lib/hybridization";
import { hardwareChatCompletion } from "@/lib/hardware/ai-client";
import { formatHardwareAiError, hardwareAiFallbackNotice } from "@/lib/hardware/ai-errors";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import {
  DEPOSIT_ANALYSIS_SYSTEM,
  buildDepositAnalysisPrompt,
  depositAnalysisSchema,
} from "@/lib/poor-man-protection/deposit-analysis";
import { buildDepositAnalysisFallback } from "@/lib/poor-man-protection/deposit-analysis-fallback";

const reqSchema = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/gif"])
    .optional()
    .default("image/jpeg"),
  fileName: z.string().max(260).optional().default("deposit.png"),
  notes: z.string().max(1000).optional().default(""),
  paletteHint: z.string().max(500).optional().default(""),
});

function parseAnalysisJson(raw: string) {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const json = JSON.parse(cleaned);
  return depositAnalysisSchema.safeParse(json);
}

export async function POST(req: NextRequest) {
  try {
    if (!(await canUseHybridizationEngine(req))) {
      return NextResponse.json(
        { error: "Sign in or enter your Pro access code to analyze deposits with AI." },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid deposit image." }, { status: 400 });
    }

    const { imageBase64, mimeType, fileName, notes, paletteHint } = parsed.data;
    const userText = buildDepositAnalysisPrompt(paletteHint || undefined, notes);

    try {
      const ai = await hardwareChatCompletion({
        system: DEPOSIT_ANALYSIS_SYSTEM,
        userContent: [
          { type: "text", text: userText },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`,
              detail: "high",
            },
          },
        ],
        temperature: 0.35,
        maxTokens: 2500,
      });

      const analysis = parseAnalysisJson(ai.text);
      if (!analysis.success) {
        return NextResponse.json(
          { error: "Could not parse deposit analysis.", details: analysis.error.flatten() },
          { status: 502 },
        );
      }

      return NextResponse.json({
        ...analysis.data,
        ...(ai.usedFallback
          ? {
              warning: `Used ${ai.provider} (${ai.model}) after the primary AI route failed.`,
            }
          : {}),
      });
    } catch (aiErr: unknown) {
      const message = aiErr instanceof Error ? aiErr.message : "Deposit analysis failed";
      console.error("[poor-man-protection/analyze-deposit] AI failed:", aiErr);

      if (isEasyPeasyWordLimitError(message) || message.includes("No AI provider")) {
        return NextResponse.json({
          ...buildDepositAnalysisFallback(fileName, [], notes),
          warning: hardwareAiFallbackNotice("deposit"),
          usedHeuristicFallback: true,
        });
      }

      const hint = formatHardwareAiError(message);
      return NextResponse.json(
        {
          error: hint.detail,
          hint,
        },
        { status: 502 },
      );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Deposit analysis failed";
    console.error("[poor-man-protection/analyze-deposit]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
