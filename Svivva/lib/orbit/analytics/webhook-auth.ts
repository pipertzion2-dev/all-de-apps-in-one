import { createHmac, timingSafeEqual } from "crypto";
import { getOrbitProjectByIdInternal } from "@/lib/orbit/ingest";
import { parseExternalAnalyticsConfig } from "./external-signals";

export function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signature.slice("sha256=".length);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}

export async function verifyProjectWebhookAuth(
  projectId: string,
  rawBody: string,
  signature: string | null,
): Promise<boolean> {
  const project = await getOrbitProjectByIdInternal(projectId);
  if (!project) return false;
  const config = parseExternalAnalyticsConfig(project.metadata as Record<string, unknown>);
  if (!config.webhookSecret) return false;
  return verifyWebhookSignature(config.webhookSecret, rawBody, signature);
}
