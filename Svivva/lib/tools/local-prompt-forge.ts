/** Deterministic offline PromptForge when no cloud AI key is configured. */

export type LocalPromptForgeResult = {
  content: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  latencyMs: number;
  costUsd: number;
  finishReason: string;
  localMode: true;
};

function estimateTokens(text: string): number {
  // Rough GPT-style estimate (~4 chars/token).
  return Math.max(1, Math.ceil(text.trim().length / 4));
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function forgeImprovedPrompt(systemPrompt: string, userMessage: string): string {
  const system = systemPrompt.trim();
  const user = userMessage.trim();
  const role = system
    ? system.replace(/\s+/g, " ").slice(0, 240)
    : "You are a clear, specific assistant. Prefer concrete steps and short paragraphs.";

  const lines = [
    "### Improved prompt (local forge)",
    "",
    "**System**",
    role,
    "",
    "**User**",
    [
      "Task:",
      user,
      "",
      "Constraints:",
      "- Be specific and actionable",
      "- Use short sections with headings when helpful",
      "- If information is missing, ask up to 3 clarifying questions first",
      "- End with a one-line summary of the recommended next step",
    ].join("\n"),
  ];
  return lines.join("\n");
}

function critique(systemPrompt: string, userMessage: string): string[] {
  const tips: string[] = [];
  if (!systemPrompt.trim()) {
    tips.push("Add a short system prompt that defines role, tone, and hard constraints.");
  } else if (systemPrompt.trim().length < 40) {
    tips.push("Expand the system prompt — include audience, format, and what to avoid.");
  }
  if (userMessage.trim().length < 24) {
    tips.push("Make the user message more specific (goal, audience, length, examples).");
  }
  if (!/\b(format|output|json|bullet|steps?)\b/i.test(userMessage + systemPrompt)) {
    tips.push("State the desired output format (bullets, JSON, checklist, etc.).");
  }
  if (!/\b(example|e\.g\.|for instance)\b/i.test(userMessage)) {
    tips.push("Include one short example of a good answer to steer quality.");
  }
  if (tips.length === 0) {
    tips.push("Prompt structure looks solid — try lowering temperature for stricter outputs.");
  }
  return tips;
}

export function runLocalPromptForge(opts: {
  systemPrompt?: string;
  userMessage: string;
  model?: string;
}): LocalPromptForgeResult {
  const start = Date.now();
  const systemPrompt = opts.systemPrompt ?? "";
  const userMessage = opts.userMessage;
  const model = opts.model || "gpt-4o-mini";

  const tips = critique(systemPrompt, userMessage);
  const improved = forgeImprovedPrompt(systemPrompt, userMessage);
  const content = [
    "Local PromptForge mode (no cloud AI key configured on this server).",
    "You still get a forged prompt + critique so the tool never dead-ends.",
    "",
    `Words — system: ${wordCount(systemPrompt)}, user: ${wordCount(userMessage)}`,
    "",
    "### Critique",
    ...tips.map((t, i) => `${i + 1}. ${t}`),
    "",
    improved,
  ].join("\n");

  const inputTokens = estimateTokens(`${systemPrompt}\n${userMessage}`);
  const outputTokens = estimateTokens(content);

  return {
    content,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    model: `${model} (local)`,
    latencyMs: Math.max(1, Date.now() - start),
    costUsd: 0,
    finishReason: "local",
    localMode: true,
  };
}
