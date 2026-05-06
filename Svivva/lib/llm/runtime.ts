import { openai, DEFAULT_MODEL } from "./openai";
import { validateOutput, type JsonSchema } from "@/lib/spec";
import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

export interface RuntimeConfig {
  systemPrompt: string;
  outputSchema: JsonSchema;
  maxTokens?: number;
  temperature?: number;
}

export interface RuntimeResult {
  success: boolean;
  output?: Record<string, unknown>;
  error?: string;
  repaired?: boolean;
  attempts?: number;
  raw?: string;
}

const MAX_REPAIR_ATTEMPTS = 2;

function buildSchemaEnforcementPrompt(outputSchema: JsonSchema): string {
  return `

IMPORTANT: Your response MUST be valid JSON that exactly matches this schema:
${JSON.stringify(outputSchema, null, 2)}

Return ONLY the JSON object, no explanations or markdown.`;
}

function buildRepairPrompt(
  original: string,
  errors: string[],
  outputSchema: JsonSchema
): string {
  return `The following JSON output has validation errors:

\`\`\`json
${original}
\`\`\`

Errors:
${errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}

Please fix the JSON to match this schema exactly:
${JSON.stringify(outputSchema, null, 2)}

Return ONLY the corrected JSON object, no explanations.`;
}

export async function executeRuntime(
  userInput: string,
  config: RuntimeConfig
): Promise<RuntimeResult> {
  const { systemPrompt, outputSchema, maxTokens = 4096 } = config;

  const fullSystemPrompt = systemPrompt + buildSchemaEnforcementPrompt(outputSchema);

  let attempts = 0;
  let lastRaw: string | undefined;
  let lastErrors: string[] = [];

  while (attempts < MAX_REPAIR_ATTEMPTS + 1) {
    attempts++;

    try {
      const messages: Array<{ role: "system" | "user"; content: string }> =
        attempts === 1
          ? [
              { role: "system", content: fullSystemPrompt },
              { role: "user", content: userInput },
            ]
          : [
              { role: "system", content: systemPrompt },
              {
                role: "user",
                content: buildRepairPrompt(lastRaw || "", lastErrors, outputSchema),
              },
            ];

      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        response_format: { type: "json_object" },
        max_completion_tokens: maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          success: false,
          error: `No response from LLM (finish_reason: ${response.choices[0]?.finish_reason})`,
          attempts,
        };
      }

      lastRaw = content;

      let parsed: Record<string, unknown>;
      try {
        parsed = JSON.parse(content);
      } catch {
        lastErrors = ["Invalid JSON syntax"];
        continue;
      }

      const validation = validateOutput(parsed, outputSchema);
      if (validation.valid) {
        return {
          success: true,
          output: parsed,
          repaired: attempts > 1,
          attempts,
        };
      }

      lastErrors = validation.errors || ["Schema validation failed"];

      if (attempts === MAX_REPAIR_ATTEMPTS + 1) {
        return {
          success: false,
          error: `Output validation failed after ${attempts} attempts: ${lastErrors.join(", ")}`,
          raw: lastRaw,
          attempts,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        attempts,
      };
    }
  }

  return {
    success: false,
    error: `Failed after ${attempts} attempts`,
    raw: lastRaw,
    attempts,
  };
}
