"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Download, Plus, Trash2, UserX } from "lucide-react";
import { ExtensionInstallCard } from "@/components/clutety/extension-install-card";
import { FeedShieldAnalyzer } from "@/components/clutety/feed-shield-analyzer";
import type { BlockedPerson, FeedShieldRules, PlatformId } from "@/lib/clutety/feed-shield-types";
import { CATEGORY_DEFS, PLATFORM_LABELS } from "@/lib/clutety/feed-shield-types";
import {
  exportFeedShieldRulesJson,
  loadFeedShieldRules,
  saveFeedShieldRules,
} from "@/lib/clutety/feed-shield-storage";

const TEAL = "#5BA8A0";

export function FeedShield() {
  const [rules, setRules] = useState<FeedShieldRules>(() => loadFeedShieldRules());
  const [keywordInput, setKeywordInput] = useState("");
  const [personName, setPersonName] = useState("");
  const [personAlias, setPersonAlias] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setRules(loadFeedShieldRules());
  }, []);

  const persist = useCallback((next: FeedShieldRules) => {
    setRules(next);
    saveFeedShieldRules(next);
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

  function addBlockedPerson() {
    const name = personName.trim();
    if (!name) return;
    const aliases = personAlias
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    const person: BlockedPerson = {
      id: crypto.randomUUID(),
      displayName: name,
      aliases: aliases.length ? aliases : [name.split(" ").pop() ?? name].filter(Boolean),
      blockAllMentions: true,
      addedAt: Date.now(),
    };
    persist({ ...rules, blockedPeople: [...rules.blockedPeople, person] });
    setPersonName("");
    setPersonAlias("");
  }

  function removePerson(id: string) {
    persist({ ...rules, blockedPeople: rules.blockedPeople.filter((p) => p.id !== id) });
  }

  function exportRules() {
    const blob = new Blob([exportFeedShieldRulesJson(rules)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clutety-feed-shield-rules.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  const activePlatforms = (Object.keys(PLATFORM_LABELS) as PlatformId[])
    .filter((p) => rules.platforms[p])
    .map((p) => PLATFORM_LABELS[p]);

  const sectionLabel: React.CSSProperties = {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
    marginBottom: 10,
  };

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
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            color: TEAL,
            margin: "0 0 8px",
          }}
        >
          Feed Shield
        </p>
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>
          Hide people & topics across social feeds
        </h3>
        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            margin: "0 0 20px",
            lineHeight: 1.6,
          }}
        >
          Block news about specific people, celebrities, or topics on YouTube, TikTok, Instagram, X,
          Reddit, and more. Clutety scans titles, descriptions, channel names, tags, and transcript
          text before content reaches your feed.
        </p>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
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
          <p style={sectionLabel}>Social platforms</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(Object.keys(PLATFORM_LABELS) as PlatformId[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() =>
                  persist({
                    ...rules,
                    platforms: { ...rules.platforms, [p]: !rules.platforms[p] },
                  })
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: rules.platforms[p]
                    ? `1px solid ${TEAL}`
                    : "1px solid rgba(255,255,255,0.12)",
                  background: rules.platforms[p]
                    ? "rgba(91,168,160,0.2)"
                    : "rgba(255,255,255,0.04)",
                  color: rules.platforms[p] ? TEAL : "rgba(255,255,255,0.45)",
                }}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>People to hide (all mentions & news)</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: "0 0 10px" }}>
            Add a famous person, ex, brand, or anyone you never want in your feed again.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            <input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Full name (e.g. Taylor Swift)"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                color: "#fff",
                fontSize: 12,
              }}
            />
            <input
              value={personAlias}
              onChange={(e) => setPersonAlias(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addBlockedPerson()}
              placeholder="Aliases, handles (comma-separated): swift, taylorswift13"
              style={{
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
              onClick={addBlockedPerson}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: TEAL,
                border: "none",
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <UserX className="w-4 h-4" /> Block this person everywhere
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {rules.blockedPeople.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                }}
              >
                <div>
                  <strong>{p.displayName}</strong>
                  {p.aliases.length > 0 && (
                    <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 8, fontSize: 10 }}>
                      {p.aliases.join(", ")}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePerson(p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.4)",
                  }}
                  aria-label={`Remove ${p.displayName}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>Analysis settings</p>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={rules.analyzeTranscripts}
              onChange={(e) => persist({ ...rules, analyzeTranscripts: e.target.checked })}
            />
            Scan YouTube / podcast transcripts & captions
          </label>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={rules.scanChannelNames}
              onChange={(e) => persist({ ...rules, scanChannelNames: e.target.checked })}
            />
            Scan channel & creator names
          </label>
        </section>

        <section style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>Block categories</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {CATEGORY_DEFS.map((c) => (
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
          <p style={sectionLabel}>Custom keywords & topics</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              placeholder="Topic, phrase, or hashtag…"
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
                background: TEAL,
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
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </section>

        <ExtensionInstallCard />

        <FeedShieldAnalyzer rules={rules} />

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={exportRules}
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Download className="w-3.5 h-3.5" /> Export rules
          </button>
        </div>

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
          <strong style={{ color: TEAL }}>Active on:</strong>{" "}
          {activePlatforms.length ? activePlatforms.join(", ") : "No platforms selected"}
          {rules.blockedPeople.length > 0 && (
            <>
              <br />
              <strong style={{ color: TEAL }}>Blocking {rules.blockedPeople.length} people</strong>
            </>
          )}
          {saved && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
              <Check className="w-3 h-3" style={{ color: TEAL }} /> Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
