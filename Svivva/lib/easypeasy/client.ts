import OpenAI from "openai";
import {
  EASYPEASY_BASE_URL,
  EASYPEASY_DEFAULT_MODEL,
  getEasyPeasyModel,
  type EasyPeasyConfig,
} from "./config";

export type EasyPeasyTestResult =
  { ok: true; model: string; reply: string } | { ok: false; error: string; status?: number };

export function buildEasyPeasyClient(apiKey: string, baseUrl = EASYPEASY_BASE_URL): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: baseUrl.replace(/\/$/, ""),
  });
}

export async function testEasyPeasyConnection(
  config: Pick<EasyPeasyConfig, "apiKey" | "model">,
): Promise<EasyPeasyTestResult> {
  const apiKey = config.apiKey?.trim();
  if (!apiKey) {
    return { ok: false, error: "Missing EasyPeasy API key" };
  }

  const model = config.model?.trim() || getEasyPeasyModel() || EASYPEASY_DEFAULT_MODEL;

  try {
    const client = buildEasyPeasyClient(apiKey);
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Reply with exactly the word OK." }],
      max_tokens: 16,
      temperature: 0,
    });

    const reply = completion.choices[0]?.message?.content?.trim() || "";
    if (!reply) {
      return { ok: false, error: "Empty response from EasyPeasy" };
    }

    return { ok: true, model, reply };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status =
      typeof e === "object" && e !== null && "status" in e && typeof e.status === "number"
        ? e.status
        : undefined;
    return { ok: false, error: message, status };
  }
}
