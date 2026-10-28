import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { getDefaultModel, isAnyAiProviderAvailable, openai } from "@/lib/llm/openai";
import {
  localSketchConceptsFromFilename,
  SKETCH_VISION_SYSTEM,
} from "@/lib/poor-man-protection/invention-studio/sketch-concepts";

export const maxDuration = 90;

const bodySchema = z.object({
  inventionId: z.string(),
  description: z.string().max(8000).optional(),
  imageBase64: z.string().max(2_500_000).optional(),
  imageMimeType: z.string().optional(),
  imageFileName: z.string().optional(),
});

type SuggestedComponent = {
  name: string;
  shape: "box" | "cylinder" | "sphere";
  material: "aluminum" | "plastic" | "stainless_steel" | "chrome" | "rubber";
  notes: string;
};

function localSuggestions(description: string, fileName?: string): SuggestedComponent[] {
  const text = `${description} ${fileName || ""}`.toLowerCase();
  const out: SuggestedComponent[] = [
    {
      name: "Primary body",
      shape: "box",
      material: "aluminum",
      notes: "Preliminary placeholder — validate dimensions before relying on geometry.",
    },
  ];
  if (/wheel|roller|cylinder|shaft|tube/i.test(text)) {
    out.push({
      name: "Cylindrical element",
      shape: "cylinder",
      material: "stainless_steel",
      notes: "Preliminary from keywords — not measured CAD.",
    });
  }
  if (/ball|sphere|knob/i.test(text)) {
    out.push({
      name: "Spherical element",
      shape: "sphere",
      material: "plastic",
      notes: "Preliminary from keywords.",
    });
  }
  if (/pad|grip|seal|gasket/i.test(text)) {
    out.push({
      name: "Elastomer contact",
      shape: "box",
      material: "rubber",
      notes: "Preliminary from keywords.",
    });
  }
  return out;
}

export async function POST(req: NextRequest) {
  await requireUser();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sketch-3d request" }, { status: 400 });
  }

  let concepts = parsed.data.imageFileName
    ? localSketchConceptsFromFilename(
        parsed.data.imageFileName,
        parsed.data.imageMimeType || "image/png",
      )
    : [];
  let suggestedComponents = localSuggestions(
    parsed.data.description || "",
    parsed.data.imageFileName,
  );
  let source: "llm_vision" | "local_fallback" = "local_fallback";

  if (isAnyAiProviderAvailable() && (parsed.data.imageBase64 || parsed.data.description)) {
    try {
      const content: Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      > = [
        {
          type: "text",
          text: `Invention text: ${parsed.data.description || "(none)"}\nPropose preliminary 3D components as JSON.`,
        },
      ];
      if (parsed.data.imageBase64) {
        content.push({
          type: "image_url",
          image_url: {
            url: `data:${parsed.data.imageMimeType || "image/jpeg"};base64,${parsed.data.imageBase64}`,
          },
        });
      }
      const completion = await openai.chat.completions.create({
        model: getDefaultModel(),
        temperature: 0.2,
        messages: [
          { role: "system", content: SKETCH_VISION_SYSTEM },
          { role: "user", content },
        ],
      });
      const raw = completion.choices[0]?.message?.content || "";
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]) as {
          concepts?: string[];
          suggestedComponents?: SuggestedComponent[];
        };
        if (data.concepts?.length) concepts = data.concepts;
        if (data.suggestedComponents?.length) {
          suggestedComponents = data.suggestedComponents.map((c) => ({
            name: c.name,
            shape: c.shape === "cylinder" || c.shape === "sphere" ? c.shape : "box",
            material: (["aluminum", "plastic", "stainless_steel", "chrome", "rubber"].includes(
              c.material,
            )
              ? c.material
              : "aluminum") as SuggestedComponent["material"],
            notes: `${c.notes || ""} · Preliminary AI visualization — validate dimensions.`,
          }));
          source = "llm_vision";
        }
      }
    } catch {
      /* local fallback */
    }
  }

  return NextResponse.json({
    concepts,
    suggestedComponents,
    source,
    preliminary: true,
    notice:
      "AI-generated models are preliminary visualizations unless dimensions and geometry are validated by you.",
    serverTimestamp: new Date().toISOString(),
  });
}
