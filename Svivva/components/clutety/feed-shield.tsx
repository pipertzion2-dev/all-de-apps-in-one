"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";

const STORAGE_KEY = "clutety-feed-shield-v1";

type PlatformId = "youtube" | "tiktok" | "instagram" | "x" | "reddit";

type FeedShieldRules = {
  enabled: boolean;
  platforms: Record<PlatformId, boolean>;
  categories: Record<string, boolean>;
  keywords: string[];
};

const PLATFORMS: { id: PlatformId; label: string }[] = [
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X (Twitter)" },
  { id: "reddit", label: "Reddit" },
];

const CATEGORIES = [
  { id: "violence", label: "Violence & gore" },
  { id: "adult", label: "Adult content" },
  { id: "gambling", label: "Gambling & betting" },
  { id: "politics", label: "Political rage-bait" },
  { id: "scams", label: "Scams & crypto pumps" },
  { id: "sensational", label: "Sensational / clickbait" },
];

const DEFAULT_RULES: FeedShieldRules = {
  enabled: true,
  platforms: {
    youtube: true,
    tiktok: true,
    instagram: false,
    x: false,
    reddit: false,
  },
  categories: Object.fromEntries(CATEGORIES.map((c) => [c.id, true])),
  keywords: [],
};

function loadRules(): FeedShieldRules {
  if (typeof window === "undefined") return DEFAULT_RULES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RULES;
    return { ...DEFAULT_RULES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_RULES;
  }
}

export function FeedShield() {
  const [rules, setRules] = useState<FeedShieldRules>(DEFAULT_RULES);
  const [keywordInput, setKeywordInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRules(loadRules());
  }, []);

  const persist = useCallback((next: FeedShieldRules) => {
    setRules(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, []);

  function addKeyword() {
    const kw = keywordInput.trim().toLowerCase();
    if (!kw || rules.keywords.includes(kw)) return;
    persist({ ...rules, keywords: [...rules.keywords, kw] });
    setKeywordInput("");
  }

  function removeKeyword(kw: string) {
    persist({ ...rules, keywords: rules.keywords.filter((k) => k !== kw) });
  }

  const activePlatforms = PLATFORMS.filter((p) => rules.platforms[p.id]).map((p) => p.label);

  return (
    <div
      style={{
        minHeight: "100%",
        background: "linear-gradient(160deg, #0a0e18 0%, #121a28 50%, #0d1119 100%)",
        color: "#e8ecf4",
        padding: "24px 20px 32px",
        overflow: "auto",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: "#5BA8A0",
            margin: "0 0 8px",
          }}
        >
          Feed Shield
        </p>
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
          Block unwanted feed content
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 20px",
            lineHeight: 1.6,
          }}
        >
          Rules are saved in your browser. Pair with the Clutety browser extension (coming soon) or
          export rules for your team.
        </p>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 20,
            padding: "12px 14px",
            borderRadius: 10,
            background: "rgba(91,168,160,0.12)",
            border: "1px solid rgba(91,168,160,0.35)",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={rules.enabled}
            onChange={(e) => persist({ ...rules, enabled: e.target.checked })}
          />
          <span style={{ fontSize: 13, fontWeight: 700 }}>Feed Shield active</span>
        </label>

        <section style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 10,
            }}
          >
            Platforms
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PLATFORMS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  persist({
                    ...rules,
                    platforms: { ...rules.platforms, [p.id]: !rules.platforms[p.id] },
                  })
                }
                style={{
                  padding: "8px 14px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: rules.platforms[p.id]
                    ? "1px solid #5BA8A0"
                    : "1px solid rgba(255,255,255,0.12)",
                  background: rules.platforms[p.id]
                    ? "rgba(91,168,160,0.2)"
                    : "rgba(255,255,255,0.04)",
                  color: rules.platforms[p.id] ? "#5BA8A0" : "rgba(255,255,255,0.45)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 10,
            }}
          >
            Block categories
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CATEGORIES.map((c) => (
              <label
                key={c.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                <input
                  type="checkbox"
                  checked={!!rules.categories[c.id]}
                  onChange={(e) =>
                    persist({
                      ...rules,
                      categories: { ...rules.categories, [c.id]: e.target.checked },
                    })
                  }
                />
                {c.label}
              </label>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <p
            style={{
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.4)",
              marginBottom: 10,
            }}
          >
            Custom keywords
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              placeholder="Add word or phrase…"
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                fontSize: 12,
              }}
            />
            <button
              type="button"
              onClick={addKeyword}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "#5BA8A0",
                border: "none",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {rules.keywords.map((kw) => (
              <span
                key={kw}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.08)",
                  fontSize: 11,
                }}
              >
                {kw}
                <button
                  type="button"
                  onClick={() => removeKeyword(kw)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.5)",
                    padding: 0,
                  }}
                  aria-label={`Remove ${kw}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </section>

        <div
          style={{
            padding: 14,
            borderRadius: 10,
            background: "rgba(91,168,160,0.08)",
            border: "1px solid rgba(91,168,160,0.2)",
            fontSize: 11,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#5BA8A0" }}>Active on:</strong>{" "}
          {activePlatforms.length ? activePlatforms.join(", ") : "No platforms selected"}
          {rules.enabled && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
              {saved && (
                <>
                  <Check className="w-3 h-3" style={{ color: "#5BA8A0" }} /> Saved
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
