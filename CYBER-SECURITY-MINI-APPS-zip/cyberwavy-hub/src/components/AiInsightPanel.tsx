import { useState } from "react";
import { getLocalInsight } from "../lib/localAiInsights";

type Props = {
  toolSlug: string;
  toolTitle: string;
  toolSummary: string;
};

export function AiInsightPanel({ toolSlug, toolTitle, toolSummary }: Props) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [source, setSource] = useState<"idle" | "openai" | "local" | "error">("idle");

  const showLocal = () => {
    setAiText(getLocalInsight(toolSlug, toolTitle));
    setSource("local");
  };

  const runAi = async () => {
    setLoading(true);
    setSource("idle");
    const contextSummary = [
      `Tool: ${toolTitle} (${toolSlug})`,
      `Description: ${toolSummary}`,
      notes.trim() ? `User notes / pasted result summary: ${notes.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("/api/ai-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolSlug, contextSummary }),
      });
      const data = (await res.json()) as { source?: string; text?: string | null };
      if (data.text) {
        setAiText(data.text);
        setSource("openai");
      } else {
        showLocal();
      }
    } catch {
      setAiText(getLocalInsight(toolSlug, toolTitle));
      setSource("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-insight-panel card" style={{ marginTop: "1.25rem", background: "rgba(255,255,255,0.42)" }}>
      <h2 className="app-title" style={{ fontSize: "1.05rem", marginTop: 0 }}>
        Smart security tips
      </h2>
      <p className="muted" style={{ marginTop: 0, fontSize: 13 }}>
        Optional AI-powered tips (add your own one-line result summary for better personalization). Works best when you set{" "}
        <code>OPENAI_API_KEY</code> on the server — otherwise you still get instant expert-style tips below.
      </p>
      <label>Your result summary (optional)</label>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder='e.g. "Headers grade C, missing CSP" or "JWT uses HS256"'
        rows={2}
        style={{ minHeight: 56 }}
      />
      <div className="row" style={{ marginTop: "0.5rem" }}>
        <button type="button" className="btn-primary" disabled={loading} onClick={runAi}>
          {loading ? "Generating…" : "Get tips"}
        </button>
        <button type="button" className="btn-primary btn-ghost" disabled={loading} onClick={showLocal}>
          Instant tips (no AI)
        </button>
      </div>
      {aiText ? (
        <div style={{ marginTop: "1rem" }}>
          <span className="badge" style={{ marginBottom: "0.5rem", display: "inline-block" }}>
            {source === "openai" ? "AI tips" : source === "error" ? "Tips (offline)" : "Expert tips"}
          </span>
          <div className="ai-insight-text" style={{ fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {aiText}
          </div>
        </div>
      ) : null}
    </div>
  );
}
