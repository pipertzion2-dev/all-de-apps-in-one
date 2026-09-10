import { NextRequest, NextResponse } from "next/server";
import { canUseHardwareBuilder, HARDWARE_ACCESS_DENIED } from "@/lib/hardware/access";
import { hardwareChatCompletion } from "@/lib/hardware/ai-client";
import { formatHardwareAiError } from "@/lib/hardware/ai-errors";
import { buildSourcingFallback } from "@/lib/hardware/sourcing-fallback";
import { buildSourcingPrompt, parseSourcingResult } from "@/lib/hardware/sourcing";
import { isEasyPeasyWordLimitError } from "@/lib/orbit/orbit-error-messages";
import { z } from "zod";

const reqSchema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(2000).optional().default(""),
  category: z.string().max(200).optional().default(""),
  materials: z.array(z.string()).optional().default([]),
  manufacturingMethod: z.string().max(200).optional().default(""),
  budgetRange: z.number().optional().default(5000),
  requirements: z.array(z.string()).optional().default([]),
  sketchNotes: z.string().max(2000).optional().default(""),
  sketchImageBase64: z.string().max(8_000_000).optional(),
  sketchMimeType: z
    .enum(["image/jpeg", "image/png", "image/webp", "image/gif"])
    .optional()
    .default("image/jpeg"),
});

export async function POST(req: NextRequest) {
  try {
    if (!(await canUseHardwareBuilder(req))) {
      return NextResponse.json({ error: HARDWARE_ACCESS_DENIED }, { status: 401 });
    }

    const body = await req.json();
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const data = parsed.data;

    const textPrompt = buildSourcingPrompt({
      productName: data.productName,
      productDescription: data.productDescription,
      category: data.category,
      materials: data.materials,
      manufacturingMethod: data.manufacturingMethod,
      budgetRange: data.budgetRange,
      requirements: data.requirements,
      sketchNotes: data.sketchNotes,
      hasSketch: Boolean(data.sketchImageBase64),
    });

    type MessageContent =
      | string
      | Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string; detail: "high" } }
        >;

    const userContent: MessageContent = data.sketchImageBase64
      ? [
          { type: "text", text: textPrompt },
          {
            type: "image_url",
            image_url: {
              url: `data:${data.sketchMimeType};base64,${data.sketchImageBase64}`,
              detail: "high",
            },
          },
        ]
      : textPrompt;

    try {
      const ai = await hardwareChatCompletion({
        system:
          "You are a manufacturing sourcing expert. Given a hardware product specification, suggest specific real-world manufacturers, material suppliers, and online platforms where each component or the full product can be manufactured. Be specific with company names, websites, and why they are a good fit. Return JSON only.",
        userContent,
        temperature: 0.7,
        maxTokens: 2500,
        jsonMode: true,
      });

      const result = parseSourcingResult(ai.text);
      return NextResponse.json({
        ...result,
        ...(ai.usedFallback
          ? { warning: `Used ${ai.provider} (${ai.model}) after the primary AI route failed.` }
          : {}),
      });
    } catch (aiErr: unknown) {
      const message = aiErr instanceof Error ? aiErr.message : "Sourcing failed";
      console.error("[hardware/manufacturers] AI failed:", aiErr);

      if (isEasyPeasyWordLimitError(message) || message.includes("No AI provider")) {
        const fallback = buildSourcingFallback({
          productName: data.productName,
          productDescription: data.productDescription,
          category: data.category,
          materials: data.materials,
          manufacturingMethod: data.manufacturingMethod,
          budgetRange: data.budgetRange,
        });
        const hint = formatHardwareAiError(message);
        return NextResponse.json({
          ...fallback,
          warning: `${hint.title}: ${hint.detail}`,
          usedHeuristicFallback: true,
        });
      }

      const hint = formatHardwareAiError(message);
      return NextResponse.json({ error: hint.detail, hint }, { status: 502 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sourcing failed";
    console.error("[hardware/manufacturers]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
