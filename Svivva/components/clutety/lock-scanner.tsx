"use client";

import { useState } from "react";
import { LockUI, SCAN_MODES } from "@/components/clutety/lock-ui";
import { usePipelineStore } from "@/lib/clutety/use-pipeline-store";

const STEP_LABELS = [
  "Hypothesizing attack surface…",
  "Combining threat vectors…",
  "Mutating attack chains…",
  "Simulating breach paths…",
  "Generating remediation…",
];

export function LockScanner() {
  const [selectedModes, setSelectedModes] = useState(
    new Set(["surface", "simulate", "comply", "remediate", "hybrid"]),
  );
  const [target, setTarget] = useState("");
  const [targetError, setTargetError] = useState("");

  const { busy, activeStepIndex, error, remedy, simulated, setSystem, runPipeline } =
    usePipelineStore();

  const scanStep = busy ? activeStepIndex : -1;
  const complete = !busy && activeStepIndex >= 5 && remedy;

  function toggleMode(id: string) {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleUnlock() {
    if (busy) return;
    const t = target.trim() || "youtube.com/feed";
    setTargetError("");
    setSystem(t);
    void runPipeline();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleUnlock();
  }

  return (
    <div
      className="clutety-lock-scanner"
      style={{
        minHeight: "100%",
        background: "linear-gradient(135deg, #EEF2F8 0%, #F4F7FC 55%, #E8EDF5 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px 32px",
        position: "relative",
        overflow: "auto",
      }}
    >
      <style>{`
        @keyframes led-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
      `}</style>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 540,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div
            style={{
              fontSize: 7,
              fontWeight: 800,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: "#6D91B3",
              marginBottom: 8,
            }}
          >
            — Security Analysis Engine —
          </div>
          <h2
            style={{
              fontSize: "clamp(18px, 2.5vw, 26px)",
              fontWeight: 800,
              color: "#1e2228",
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            {busy ? "Analyzing…" : complete ? "Scan Complete" : "Configure & Launch"}
          </h2>
          <p style={{ fontSize: 11, color: "#606870", margin: 0, maxWidth: 340 }}>
            {busy
              ? STEP_LABELS[Math.max(0, activeStepIndex)]
              : "Select scan modes, enter a feed or domain target, click the keyhole to run."}
          </p>
        </div>

        {!busy && !complete && (
          <div
            style={{
              width: "100%",
              marginBottom: 16,
              background: "rgba(255,255,255,0.5)",
              border: targetError ? "1px solid rgba(190,100,80,0.5)" : "1px solid rgba(0,0,0,0.12)",
              borderRadius: 8,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#808890",
                flexShrink: 0,
              }}
            >
              TARGET
            </span>
            <input
              value={target}
              onChange={(e) => {
                setTarget(e.target.value);
                setTargetError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="youtube.com, tiktok.com, or api…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 12,
                color: "#1e2228",
              }}
            />
          </div>
        )}

        <div style={{ position: "relative" }}>
          <LockUI
            size={320}
            selectedModes={selectedModes}
            onModeToggle={toggleMode}
            onUnlock={handleUnlock}
            scanStep={scanStep}
            scanning={busy}
          />
        </div>

        {busy && (
          <div
            style={{
              width: "100%",
              maxWidth: 320,
              marginTop: 12,
              height: 3,
              background: "rgba(0,0,0,0.08)",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                background: "linear-gradient(to right, #6D91B3, #AC81AF)",
                width: `${Math.min(100, ((activeStepIndex + 1) / 5) * 100)}%`,
                transition: "width 0.5s ease",
              }}
            />
          </div>
        )}

        {error && !busy && <p style={{ marginTop: 12, fontSize: 11, color: "#b06858" }}>{error}</p>}

        {complete && remedy && (
          <div
            style={{
              marginTop: 20,
              width: "100%",
              maxWidth: 400,
              padding: 16,
              borderRadius: 10,
              background: "rgba(255,255,255,0.65)",
              border: "1px solid rgba(109,145,179,0.35)",
              textAlign: "left",
            }}
          >
            <p
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#6D91B3",
                margin: "0 0 8px",
              }}
            >
              Remediation
            </p>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#1e2228", margin: "0 0 6px" }}>
              {remedy.fix}
            </p>
            <p style={{ fontSize: 11, color: "#505860", margin: "0 0 10px", lineHeight: 1.5 }}>
              {remedy.explanation}
            </p>
            {simulated?.attack_steps?.length ? (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10, color: "#606870" }}>
                {simulated.attack_steps.map((s) => (
                  <li key={s} style={{ marginBottom: 4 }}>
                    {s}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}

        {!busy && (
          <button
            type="button"
            onClick={handleUnlock}
            style={{
              marginTop: 16,
              width: "100%",
              maxWidth: 320,
              padding: "12px 20px",
              borderRadius: 8,
              cursor: "pointer",
              background:
                "linear-gradient(135deg, rgba(109,145,179,0.15) 0%, rgba(172,129,175,0.15) 100%)",
              border: "1px solid rgba(109,145,179,0.4)",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#3e6a9a",
            }}
          >
            Unlock & Run Full Scan
          </button>
        )}
      </div>
    </div>
  );
}
