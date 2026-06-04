import { z } from "zod";
import { hasCompleteStripeEnvKeys } from "@/lib/stripe/client";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),

  OPENAI_API_KEY: z.string().optional(),
  AI_INTEGRATIONS_OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_URL: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Environment validation failed:");
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = validateEnv();

export function getOpenAIApiKey(): string | undefined {
  return process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
}

export function getOpenAIBaseUrl(): string | undefined {
  return process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
}

export function getOllamaUrl(): string | undefined {
  return process.env.OLLAMA_URL?.trim() || undefined;
}

/** Base URL for Ollama HTTP API (`/api/chat`), from OLLAMA_URL or OLLAMA_HOST. */
export function getOllamaApiBase(): string | undefined {
  const raw = process.env.OLLAMA_HOST?.trim() || getOllamaUrl();
  if (!raw) return undefined;
  return raw.replace(/\/v1\/?$/i, "").replace(/\/$/, "");
}

export function getOllamaModel(): string {
  return process.env.OLLAMA_MODEL?.trim() || "llama3.1";
}

export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY?.trim() || undefined;
}

export function hasStripeConfigured(): boolean {
  return hasCompleteStripeEnvKeys();
}

export function hasStripeWebhookConfigured(): boolean {
  return !!process.env.STRIPE_WEBHOOK_SECRET?.trim();
}
