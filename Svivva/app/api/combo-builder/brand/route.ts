import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { openai, DEFAULT_MODEL } from "@/lib/llm";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyDescription, selectedAPIs, goals } = await request.json();

    if (!companyDescription) {
      return NextResponse.json(
        { error: "Company description is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a brand identity specialist. Generate creative and professional brand identity suggestions for an API product suite.

Return a JSON object with this exact structure:
{
  "brandSuggestions": [
    {
      "name": "string - brand/product name",
      "tagline": "string - catchy tagline",
      "colorScheme": ["#hex1", "#hex2", "#hex3"] - 3 brand colors,
      "logoDescription": "string - detailed description of logo concept that could be used to generate the logo"
    }
  ]
}

Guidelines:
- Generate 2-3 unique brand identity suggestions
- Names should be memorable, professional, and easy to pronounce
- Consider tech industry naming conventions (compound words, portmanteaus, abstract concepts)
- Color schemes should be modern, accessible, and work well together
- Logo descriptions should be detailed enough for AI image generation
- Each suggestion should have a distinct personality`;

    const userPrompt = `Generate brand identity suggestions for this API product:

**Company Context:**
${companyDescription}

**APIs Included:**
${selectedAPIs?.join(", ") || "Various business APIs"}

**Business Goals:**
${goals || "Not specified"}

Create unique, professional brand identity options that would resonate with the target market.`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.9,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content);

    if (!result.brandSuggestions) {
      throw new Error("Invalid response structure");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Brand generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate brand suggestions" },
      { status: 500 }
    );
  }
}
