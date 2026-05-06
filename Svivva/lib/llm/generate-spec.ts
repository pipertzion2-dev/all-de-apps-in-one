import { openai, DEFAULT_MODEL } from "./openai";
import { ProjectSpecSchema, type ProjectSpec, type JsonSchema } from "@/lib/spec";

const SYSTEM_PROMPT = `You are an expert API designer. Given a user's description of what they want their AI API to do, generate a complete ProjectSpec JSON that defines the API behavior.

The ProjectSpec must include:
1. name: A clear, descriptive name for the API
2. slug: A URL-safe lowercase identifier (use hyphens)
3. description: A brief description of what the API does
4. systemPrompt: Detailed instructions for the AI model (10-10000 chars)
5. endpoints: At least one endpoint with path, method, and outputSchema
6. examples: 2-3 training examples showing input/output pairs
7. constraints: Model parameters (temperature, maxTokens, etc.)

For the outputSchema, use valid JSON Schema format with:
- type: "object"
- properties: object with property definitions
- required: array of required property names

Be creative but practical. Generate realistic, useful APIs.`;

const OUTPUT_SCHEMA: JsonSchema = {
  type: "object",
  properties: {
    version: { type: "string", enum: ["1.0"] },
    name: { type: "string" },
    slug: { type: "string" },
    description: { type: "string" },
    systemPrompt: { type: "string" },
    endpoints: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          method: { type: "string", enum: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
          description: { type: "string" },
          outputSchema: {
            type: "object",
            properties: {
              type: { type: "string" },
              properties: { type: "object" },
              required: { type: "array", items: { type: "string" } },
            },
          },
        },
        required: ["path", "method", "outputSchema"],
      },
    },
    examples: {
      type: "array",
      items: {
        type: "object",
        properties: {
          input: { type: "string" },
          output: { type: "object" },
          description: { type: "string" },
        },
        required: ["input", "output"],
      },
    },
    constraints: {
      type: "object",
      properties: {
        maxTokens: { type: "integer" },
        temperature: { type: "number" },
        responseFormat: { type: "string" },
        validationStrict: { type: "boolean" },
        retryOnFailure: { type: "boolean" },
        maxRetries: { type: "integer" },
      },
    },
    metadata: {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
        category: { type: "string" },
        isPublic: { type: "boolean" },
      },
    },
  },
  required: ["version", "name", "slug", "description", "systemPrompt", "endpoints"],
};

export interface GenerateSpecResult {
  success: boolean;
  spec?: ProjectSpec;
  error?: string;
  rawResponse?: string;
}

export async function generateProjectSpec(
  prompt: string,
  name?: string
): Promise<GenerateSpecResult> {
  try {
    const userMessage = name
      ? `Create an AI API called "${name}" that does the following:\n\n${prompt}`
      : `Create an AI API that does the following:\n\n${prompt}`;

    console.log("[LLM] Calling OpenAI with prompt:", userMessage.substring(0, 100));
    
    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 16384,
    });

    console.log("[LLM] Response received:", JSON.stringify(response.choices?.[0], null, 2).substring(0, 500));

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("[LLM] No content in response. Full response:", JSON.stringify(response));
      return {
        success: false,
        error: `No response from LLM. Finish reason: ${response.choices[0]?.finish_reason || "unknown"}`,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return {
        success: false,
        error: "Failed to parse LLM response as JSON",
        rawResponse: content,
      };
    }

    const validation = ProjectSpecSchema.safeParse(parsed);
    if (!validation.success) {
      return {
        success: false,
        error: `Validation failed: ${validation.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", ")}`,
        rawResponse: content,
      };
    }

    return {
      success: true,
      spec: validation.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}
