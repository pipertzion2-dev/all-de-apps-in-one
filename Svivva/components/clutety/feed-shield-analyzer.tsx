"use client";

import { useState } from "react";
import { Loader2, ScanSearch } from "lucide-react";
import { analyzeFeedItem } from "@/lib/clutety/feed-shield-engine";
import type {
  FeedAnalysisResult,
  FeedItemInput,
  FeedShieldRules,
  PlatformId,
} from "@/lib/clutety/feed-shield-types";
import { PLATFORM_LABELS } from "@/lib/clutety/feed-shield-types";

const TEAL = "#5BA8A0";

type Props = {
  rules: FeedShieldRules;
};

export function FeedShieldAnalyzer({ rules }: Props) {
  const [platform, setPlatform] = useState<PlatformId>("youtube");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("");
  const [transcript, setTranscript] = useState("");
  const [tags, setTags] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [deepAnalyze, setDeepAnalyze] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingYoutube, setFetchingYoutube] = useState(false);
  const [result, setResult] = useState<(FeedAnalysisResult & { aiAssisted?: boolean }) | null>(
    null,
  );

  async function importFromYoutube() {
    const url = youtubeUrl.trim();
    if (!url) return;
    setFetchingYoutube(true);
    try {
      const res = await fetch("/api/clutety/fetch-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, rules, includeAnalysis: true }),
      });
      const data = (await res.json()) as {
        error?: string;
        item?: FeedItemInput;
        analysis?: FeedAnalysisResult & { aiAssisted?: boolean };
        hasTranscript?: boolean;
      };
      if (!res.ok) {
        setResult({
          action: "allow",
          confidence: 0,
          reasons: [data.error ?? "Could not fetch YouTube data"],
          matches: [],
          scannedFields: [],
          platform: "youtube",
        });
        return;
      }
      if (data.item) {
        setPlatform("youtube");
        setTitle(data.item.title ?? "");
        setChannel(data.item.channel ?? "");
        setDescription(data.item.description ?? "");
        setTranscript(data.item.transcript ?? "");
        setTags((data.item.tags ?? []).join(", "));
      }
      if (data.analysis) setResult(data.analysis);
    } finally {
      setFetchingYoutube(false);
    }
  }

  async function runAnalysis() {
    const item: FeedItemInput = {
      platform,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
      channel: channel.trim() || undefined,
      transcript: transcript.trim() || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    setLoading(true);
    try {
      const local = analyzeFeedItem(item, rules);
      if (local.action === "block" || !deepAnalyze || !(transcript.trim().length > 80)) {
        setResult(local);
        return;
      }

      const res = await fetch("/api/clutety/analyze-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, rules, deepAnalyze: true }),
      });
      if (res.ok) {
        setResult((await res.json()) as FeedAnalysisResult & { aiAssisted?: boolean });
      } else {
        setResult(local);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.25)",
    color: "#fff",
    fontSize: 12,
    fontFamily: "inherit",
  };

  return (
    <section style={{ marginBottom: 20 }}>
      <p
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.4)",
          marginBottom: 8,
        }}
      >
        Test a post (metadata + transcript)
      </p>
      <p
        style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginBottom: 12, lineHeight: 1.5 }}
      >
        Paste a YouTube URL to pull title, description, channel, and auto-captions — or enter fields
        manually. Clutety checks blocked people (e.g. celebrities you never want news about) and
        topics before content hits your feed.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="YouTube URL (analyzes metadata + transcript)"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void importFromYoutube()}
          style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
        />
        <button
          type="button"
          onClick={() => void importFromYoutube()}
          disabled={fetchingYoutube || !youtubeUrl.trim()}
          style={{
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: TEAL,
            color: "#fff",
            fontWeight: 700,
            fontSize: 11,
            cursor: fetchingYoutube ? "wait" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {fetchingYoutube ? "Fetching…" : "Import"}
        </button>
      </div>

      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value as PlatformId)}
        style={{ ...inputStyle, marginBottom: 8 }}
      >
        {(Object.keys(PLATFORM_LABELS) as PlatformId[]).map((id) => (
          <option key={id} value={id} style={{ color: "#000" }}>
            {PLATFORM_LABELS[id]}
          </option>
        ))}
      </select>

      <input
        placeholder="Video / post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ ...inputStyle, marginBottom: 8 }}
      />
      <input
        placeholder="Channel or creator name"
        value={channel}
        onChange={(e) => setChannel(e.target.value)}
        style={{ ...inputStyle, marginBottom: 8 }}
      />
      <textarea
        placeholder="Description or caption"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        style={{ ...inputStyle, marginBottom: 8, resize: "vertical" }}
      />
      <textarea
        placeholder="Transcript excerpt (YouTube auto-captions, podcast text, etc.)"
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        rows={4}
        style={{ ...inputStyle, marginBottom: 8, resize: "vertical" }}
      />
      <input
        placeholder="Tags (comma-separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        style={{ ...inputStyle, marginBottom: 10 }}
      />

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          marginBottom: 12,
          cursor: "pointer",
        }}
      >
        <input
          type="checkbox"
          checked={deepAnalyze}
          onChange={(e) => setDeepAnalyze(e.target.checked)}
        />
        Deep transcript analysis (uses AI when configured on Svivva)
      </label>

      <button
        type="button"
        onClick={() => void runAnalysis()}
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 16px",
          borderRadius: 8,
          border: "none",
          background: TEAL,
          color: "#fff",
          fontWeight: 700,
          fontSize: 12,
          cursor: loading ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ScanSearch className="w-4 h-4" />
        )}
        Analyze this feed item
      </button>

      {result && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 10,
            background: result.action === "block" ? "rgba(190,80,70,0.12)" : "rgba(91,168,160,0.1)",
            border: `1px solid ${result.action === "block" ? "rgba(190,80,70,0.35)" : "rgba(91,168,160,0.3)"}`,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: result.action === "block" ? "#e8a098" : TEAL,
              margin: "0 0 6px",
            }}
          >
            {result.action === "block" ? "Would hide from feed" : "Would allow in feed"}
            <span style={{ fontWeight: 500, opacity: 0.7, marginLeft: 8 }}>
              {Math.round(result.confidence * 100)}% confidence
            </span>
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
            {result.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          {result.scannedFields.length > 0 && (
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", margin: "8px 0 0" }}>
              Scanned: {result.scannedFields.join(", ")}
              {result.aiAssisted ? " · AI-assisted" : ""}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
