import { openai, DEFAULT_MODEL } from "../openai";
import { type JsonSchema } from "@/lib/spec";

export interface SchemaEnhancementResult {
  success: boolean;
  suggestedSchema?: JsonSchema;
  rationale?: string;
  riskLevel?: string;
  improvements?: { field: string; change: string; reason: string }[];
  error?: string;
}

const ENHANCER_PROMPT = `You are a neural schema enhancement engine. Analyze JSON Schema definitions for AI API outputs and suggest improvements that will make the API more robust, useful, and well-structured.

Analyze the schema for:
1. MISSING FIELDS: Common fields that users would expect but are absent
2. TYPE PRECISION: Fields that could use more specific types (e.g., string -> enum, number -> integer with min/max)
3. VALIDATION: Missing constraints (minLength, maxLength, pattern, minimum, maximum)
4. STRUCTURE: Better nesting, array item schemas, optional vs required fields
5. DOCUMENTATION: Missing descriptions for fields
6. EDGE CASES: Fields for error states, metadata, confidence scores

Risk levels:
- "low": Additive changes only (new optional fields, better descriptions)
- "medium": Type refinements or new required fields
- "high": Structural changes that may break existing consumers

Return a JSON object with:
- suggestedSchema: The improved JSON Schema
- rationale: Overall explanation of improvements
- riskLevel: "low", "medium", or "high"
- improvements: Array of { field, change, reason } objects describing each change`;

export async function enhanceSchema(
  outputSchema: JsonSchema,
  systemPrompt: string,
): Promise<SchemaEnhancementResult> {
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: ENHANCER_PROMPT },
        {
          role: "user",
          content: `Enhance this JSON Schema for an AI API:

CURRENT SCHEMA:
${JSON.stringify(outputSchema, null, 2)}

API SYSTEM PROMPT (for context):
${systemPrompt.substring(0, 2000)}

Return JSON with: suggestedSchema (valid JSON Schema object), rationale, riskLevel ("low"/"medium"/"high"), improvements (array of {field, change, reason})`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 8192,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { success: false, error: "No response from neural schema enhancer" };
    }

    const parsed = JSON.parse(content);
    return {
      success: true,
      suggestedSchema: parsed.suggestedSchema || parsed.suggested_schema,
      rationale: parsed.rationale,
      riskLevel: parsed.riskLevel || parsed.risk_level || "medium",
      improvements: parsed.improvements || [],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
