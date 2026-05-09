import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { openai, DEFAULT_MODEL } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyDescription, primaryAPIPrompt, goals } = await request.json();

    if (!companyDescription || !primaryAPIPrompt) {
      return NextResponse.json(
        { error: "Company description and primary API prompt are required" },
        { status: 400 },
      );
    }

    const systemPrompt = `You are an AI business analyst specializing in API product development. 
Analyze the user's business context and suggest complementary APIs that would work well together 
to create a cohesive product suite. Also provide brand identity suggestions.

Return a JSON object with this exact structure:
{
  "industry": "string - the industry/sector",
  "targetAudience": "string - who would use these APIs",
  "coreValue": "string - the main value proposition",
  "suggestedAPIs": [
    {
      "name": "string - API name",
      "description": "string - what this API does",
      "purpose": "string - why this complements the primary API",
      "selected": true/false - primary API should be true
    }
  ],
  "brandSuggestions": [
    {
      "name": "string - brand/product name",
      "tagline": "string - catchy tagline",
      "colorScheme": ["#hex1", "#hex2", "#hex3"] - 3 brand colors,
      "logoDescription": "string - description of logo concept"
    }
  ]
}

Guidelines:
- The first API in suggestedAPIs should be the user's primary API idea (selected: true)
- Suggest 3-5 additional complementary APIs that work well together
- All additional APIs should have selected: false initially
- Provide 2-3 brand identity suggestions with unique names and color schemes
- Brand names should be professional, memorable, and relevant to the industry
- Color schemes should be modern and appropriate for the industry`;

    const userPrompt = `Analyze this business and suggest a complete API product suite:

**Company Description:**
${companyDescription}

**Primary API Idea:**
${primaryAPIPrompt}

**Business Goals:**
${goals || "Not specified"}

Suggest complementary APIs that would help this business achieve their goals and create a cohesive product. Also suggest brand identity options.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const analysis = JSON.parse(content);

    // Validate structure
    if (!analysis.industry || !analysis.suggestedAPIs || !analysis.brandSuggestions) {
      throw new Error("Invalid response structure");
    }

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Combo builder analyze error:", error);
    return NextResponse.json({ error: "Failed to analyze business context" }, { status: 500 });
  }
}
