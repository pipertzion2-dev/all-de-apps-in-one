import { NextRequest, NextResponse } from "next/server";
import { canUseHardwareBuilder, HARDWARE_ACCESS_DENIED } from "@/lib/hardware/access";
import { hardwareChatCompletion } from "@/lib/hardware/ai-client";
import { formatHardwareAiError, hardwareAiFallbackNotice } from "@/lib/hardware/ai-errors";
import { buildSketchAnalysisFallback } from "@/lib/hardware/sketch-fallback";
import {
  SKETCH_ANALYSIS_SYSTEM,
  buildSketchAnalysisPrompt,
  sketchAnalysisSchema,
} from "@/lib/hardware/sketch-analysis";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import { z } from "zod";

const reqSchema = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/gif"])
    .optional()
    .default("image/jpeg"),
  notes: z.string().max(1000).optional().default(""),
});

function parseAnalysisJson(raw: string) {
  const cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
  const json = JSON.parse(cleaned);
  return sketchAnalysisSchema.safeParse(json);
}

export async function POST(req: NextRequest) {
  try {
    if (!(await canUseHardwareBuilder(req))) {
      return NextResponse.json({ error: HARDWARE_ACCESS_DENIED }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sketch upload." }, { status: 400 });
    }

    const { imageBase64, mimeType, notes } = parsed.data;
    const userText =
      buildSketchAnalysisPrompt() +
      (notes.trim() ? `\n\nUser notes about the sketch: ${notes.trim()}` : "");

    try {
      const ai = await hardwareChatCompletion({
        system: SKETCH_ANALYSIS_SYSTEM,
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
        temperature: 0.4,
        maxTokens: 2000,
      });

      const analysis = parseAnalysisJson(ai.text);
      if (!analysis.success) {
        return NextResponse.json(
          { error: "Could not parse sketch analysis.", details: analysis.error.flatten() },
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
      const message = aiErr instanceof Error ? aiErr.message : "Sketch analysis failed";
      console.error("[hardware/analyze-sketch] AI failed:", aiErr);

      // When quota is exhausted or all providers fail, pre-fill from notes so BUILD isn't blocked.
      if (isEasyPeasyWordLimitError(message) || message.includes("No AI provider")) {
        const fallback = buildSketchAnalysisFallback(notes);
        return NextResponse.json({
          ...fallback,
          warning: hardwareAiFallbackNotice("sketch"),
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
    const message = err instanceof Error ? err.message : "Sketch analysis failed";
    console.error("[hardware/analyze-sketch]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
