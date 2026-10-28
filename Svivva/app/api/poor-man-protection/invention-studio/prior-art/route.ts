import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { isAnyAiProviderAvailable, openai, getDefaultModel } from "@/lib/llm/openai";
import { runPriorArtRadar } from "@/lib/poor-man-protection/invention-studio/prior-art-radar";
import { localSketchConceptsFromFilename, SKETCH_VISION_SYSTEM } from "@/lib/poor-man-protection/invention-studio/sketch-concepts";
import { INVENTION_CATEGORIES, PROTOTYPE_STATUSES } from "@/lib/poor-man-protection/invention-studio/types";

export const maxDuration = 90;

const fieldsSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(INVENTION_CATEGORIES),
  inventors: z.array(z.any()),
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
  collaborators: z.array(z.any()),
});

const bodySchema = z.object({
  inventionId: z.string(),
  fields: fieldsSchema,
  extraQuestion: z.string().max(2000).optional(),
  imageBase64: z.string().max(2_500_000).optional(),
  imageMimeType: z.string().optional(),
  imageFileName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  await requireUser();
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid prior-art request" }, { status: 400 });
  }

  let imageConcepts: string[] = [];
  if (parsed.data.imageFileName) {
    imageConcepts = localSketchConceptsFromFilename(
      parsed.data.imageFileName,
      parsed.data.imageMimeType || "image/png",
    );
  }

  if (parsed.data.imageBase64 && isAnyAiProviderAvailable()) {
    try {
      const completion = await openai.chat.completions.create({
        model: getDefaultModel(),
        temperature: 0.2,
        messages: [
          { role: "system", content: SKETCH_VISION_SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract technical concepts and search queries from this invention image. JSON only.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${parsed.data.imageMimeType || "image/jpeg"};base64,${parsed.data.imageBase64}`,
                },
              },
            ],
          },
        ],
      });
      const raw = completion.choices[0]?.message?.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedVision = JSON.parse(jsonMatch[0]) as {
          concepts?: string[];
          searchQueries?: string[];
        };
        imageConcepts = [
          ...imageConcepts,
          ...(parsedVision.concepts || []),
          ...(parsedVision.searchQueries || []),
        ];
      }
    } catch {
      /* keep filename-based concepts — never fabricate patents */
    }
  }

  const report = await runPriorArtRadar({
    fields: parsed.data.fields,
    inventionId: parsed.data.inventionId,
    extraQuestion: parsed.data.extraQuestion,
    imageConcepts: [...new Set(imageConcepts)],
  });
  report.serverTimestamp = new Date().toISOString();

  return NextResponse.json({
    report,
    notice:
      "Live PatentsView hits appear only when the API succeeds. Otherwise you receive official search links — never fabricated publications.",
  });
}
