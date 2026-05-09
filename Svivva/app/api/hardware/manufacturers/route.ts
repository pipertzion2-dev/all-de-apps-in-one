import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { openai, DEFAULT_MODEL } from "@/lib/llm/openai";
import { z } from "zod";

const reqSchema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(2000).optional().default(""),
  category: z.string().max(200).optional().default(""),
  materials: z.array(z.string()).optional().default([]),
  manufacturingMethod: z.string().max(200).optional().default(""),
  budgetRange: z.number().optional().default(5000),
  requirements: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const body = await req.json();
    const parsed = reqSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    const data = parsed.data;

    const resp = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0.7,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a manufacturing sourcing expert. Given a hardware product specification, suggest specific real-world manufacturers, suppliers, and online platforms where each component or the full product can be manufactured. Be specific with company names, websites, and why they're a good fit. Return JSON only.`,
        },
        {
          role: "user",
          content: `Product: "${data.productName}"
Description: ${data.productDescription || "N/A"}
Category: ${data.category || "General"}
Materials: ${data.materials.join(", ") || "Not specified"}
Manufacturing Method: ${data.manufacturingMethod || "Not specified"}
Budget: $${data.budgetRange.toLocaleString()}
Requirements: ${data.requirements.join(", ") || "None"}

Return a JSON object with this exact structure:
{
  "manufacturers": [
    {
      "name": "Company Name",
      "website": "https://...",
      "specialty": "What they're best at",
      "fit": "Why they fit this product",
      "estimatedCost": "$X,XXX - $X,XXX",
      "moq": "Minimum order quantity",
      "location": "Country/Region",
      "leadTime": "X-X weeks"
    }
  ],
  "materialSuppliers": [
    {
      "material": "Material name",
      "supplier": "Supplier name",
      "website": "https://...",
      "priceRange": "$X per unit/kg"
    }
  ],
  "platforms": [
    {
      "name": "Platform name",
      "website": "https://...",
      "type": "Marketplace/Service",
      "description": "What it offers"
    }
  ],
  "recommendation": "A brief overall recommendation for the best manufacturing approach"
}`,
        },
      ],
    });

    const raw = resp.choices[0]?.message?.content || "{}";
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sourcing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
