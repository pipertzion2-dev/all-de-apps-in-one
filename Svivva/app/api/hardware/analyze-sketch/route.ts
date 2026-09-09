import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import {
  SKETCH_ANALYSIS_SYSTEM,
  buildSketchAnalysisPrompt,
  sketchAnalysisSchema,
} from "@/lib/hardware/sketch-analysis";
import { z } from "zod";

const reqSchema = z.object({
  imageBase64: z.string().min(100).max(8_000_000),
  mimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/gif"])
    .optional()
    .default("image/jpeg"),
  notes: z.string().max(1000).optional().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Sign in to analyze sketches." }, { status: 401 });
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

    const resp = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        { role: "system", content: SKETCH_ANALYSIS_SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    const raw = resp.choices[0]?.message?.content || "{}";
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const json = JSON.parse(cleaned);
    const analysis = sketchAnalysisSchema.safeParse(json);
    if (!analysis.success) {
      return NextResponse.json(
        { error: "Could not parse sketch analysis.", details: analysis.error.flatten() },
        { status: 502 },
      );
    }

    return NextResponse.json(analysis.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sketch analysis failed";
    console.error("[hardware/analyze-sketch]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
