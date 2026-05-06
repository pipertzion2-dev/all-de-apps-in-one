/**
 * Shared AI insight handler — used by server.mjs (production) and Vite dev middleware.
 * Set OPENAI_API_KEY (e.g. Replit Secrets) for live tips. Without it, clients use local fallback text.
 */
export async function getAiInsight(body, env) {
  const key = env.OPENAI_API_KEY;
  const toolSlug = String(body?.toolSlug ?? "").slice(0, 120);
  const contextSummary = String(body?.contextSummary ?? "").slice(0, 6000);

  if (!key) {
    return { source: "none", text: null };
  }

  const user = `Security mini-app: ${toolSlug}\n\nContext from the user (optional notes + tool description):\n${contextSummary}\n\nGive 3–5 short bullet lines (use leading "• "). Practical, non-alarmist. No markdown headings. Under 120 words.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content:
            "You help users understand cybersecurity checks. Be accurate; do not claim scans ran on their servers. Encourage responsible testing and link-style CTAs only as plain text.",
        },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    console.error("[ai-insight] OpenAI error", res.status, err.slice(0, 200));
    return { source: "error", text: null };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || null;
  return { source: "openai", text };
}
