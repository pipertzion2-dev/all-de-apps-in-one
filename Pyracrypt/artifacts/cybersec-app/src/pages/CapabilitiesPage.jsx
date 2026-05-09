import { useState } from "react";
import { useLocation } from "wouter";

const CAPS = [
  {
    cat: "Threat",
    name: "STRIDE Analysis",
    color: "#DCE5CA",
    desc: "Full STRIDE model across all system components",
  },
  {
    cat: "Threat",
    name: "MITRE ATT&CK Mapping",
    color: "#DCE5CA",
    desc: "Maps findings to ATT&CK techniques and tactics",
  },
  {
    cat: "Threat",
    name: "Attack Chain Simulation",
    color: "#DCE5CA",
    desc: "Multi-step attack path modeling and blast radius",
  },
  {
    cat: "Threat",
    name: "Lateral Movement",
    color: "#DCE5CA",
    desc: "Internal network pivot simulation",
  },
  {
    cat: "AI-Sec",
    name: "LLM Prompt Injection",
    color: "#AC81AF",
    desc: "Tests AI/LLM endpoints for injection vulnerabilities",
  },
  {
    cat: "AI-Sec",
    name: "Model Exfiltration",
    color: "#AC81AF",
    desc: "Detects model inversion and data extraction risks",
  },
  {
    cat: "AI-Sec",
    name: "Supply Chain AI Risk",
    color: "#AC81AF",
    desc: "Audits third-party model dependencies",
  },
  {
    cat: "Compliance",
    name: "NIST CSF Alignment",
    color: "#6D91B3",
    desc: "Maps every finding to NIST Cybersecurity Framework",
  },
  {
    cat: "Compliance",
    name: "SOC 2 Readiness",
    color: "#6D91B3",
    desc: "Identifies gaps in trust service criteria",
  },
  {
    cat: "Compliance",
    name: "ISO 27001 Mapping",
    color: "#6D91B3",
    desc: "Aligns controls to ISO 27001 Annex A",
  },
  {
    cat: "Compliance",
    name: "GDPR Risk Surface",
    color: "#6D91B3",
    desc: "Identifies PII exposure and data flow risk",
  },
  {
    cat: "Threat",
    name: "Zero-Day Fuzzing",
    color: "#DCE5CA",
    desc: "Mutation-based fuzzing for novel vulnerability discovery",
  },
  {
    cat: "AI-Sec",
    name: "Adversarial Robustness",
    color: "#AC81AF",
    desc: "Tests ML models against adversarial inputs",
  },
  {
    cat: "Compliance",
    name: "HIPAA Controls",
    color: "#6D91B3",
    desc: "Healthcare data security gap analysis",
  },
];

const CATS = ["All", "Threat", "AI-Sec", "Compliance"];
const CAT_COLORS = {
  All: "#505860",
  Threat: "#DCE5CA",
  "AI-Sec": "#AC81AF",
  Compliance: "#6D91B3",
};

export default function CapabilitiesPage() {
  const [active, setActive] = useState("All");
  const [, navigate] = useLocation();
  const shown = active === "All" ? CAPS : CAPS.filter((c) => c.cat === active);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #EEF2F8 0%, #F4F7FC 60%, #E8EDF5 100%)",
        paddingTop: 80,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 80px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span
            style={{
              width: 20,
              height: 1.5,
              background: "#6D91B3",
              display: "inline-block",
              borderRadius: 1,
            }}
          />
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#606870",
            }}
          >
            Capabilities
          </span>
          <span
            style={{
              width: 20,
              height: 1.5,
              background: "#6D91B3",
              display: "inline-block",
              borderRadius: 1,
            }}
          />
        </div>

        <h1
          style={{
            fontSize: "clamp(36px,5vw,72px)",
            fontWeight: 800,
            color: "#1e2228",
            textTransform: "uppercase",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            margin: "0 0 16px",
          }}
        >
          37 engines.
          <br />
          <span
            style={{
              backgroundImage:
                "linear-gradient(135deg, #3e6090 0%, #6D91B3 40%, #a0c0d8 60%, #6D91B3 80%, #3e6090 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Every attack surface.
          </span>
        </h1>

        <p
          style={{
            fontSize: 13.5,
            color: "#505860",
            lineHeight: 1.9,
            maxWidth: 540,
            marginBottom: 40,
          }}
        >
          Purpose-built AI models for every class of vulnerability. Threat detection, AI-specific
          risks, and compliance — all running in parallel, cross-validating in real time.
        </p>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 36, flexWrap: "wrap" }}>
          {CATS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                padding: "6px 18px",
                borderRadius: 20,
                cursor: "pointer",
                background: active === cat ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
                border:
                  active === cat ? `1.5px solid ${CAT_COLORS[cat]}` : "1px solid rgba(0,0,0,0.1)",
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: active === cat ? CAT_COLORS[cat] : "#606870",
                backdropFilter: "blur(8px)",
                boxShadow: active === cat ? `0 0 12px ${CAT_COLORS[cat]}44` : "none",
                transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Capabilities grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 12,
            marginBottom: 52,
          }}
        >
          {shown.map((c) => (
            <div
              key={c.name}
              style={{
                background: "rgba(255,255,255,0.38)",
                backdropFilter: "blur(10px)",
                border: `1px solid ${c.color}44`,
                borderRadius: 8,
                padding: "18px 20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: c.color,
                    boxShadow: `0 0 6px ${c.color}`,
                  }}
                />
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "#1e2228",
                    letterSpacing: "0.04em",
                  }}
                >
                  {c.name}
                </div>
              </div>
              <p style={{ fontSize: 11, color: "#606870", lineHeight: 1.7, margin: 0 }}>{c.desc}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "12px 32px",
            borderRadius: 6,
            cursor: "pointer",
            background: "rgba(109,145,179,0.12)",
            border: "1px solid rgba(109,145,179,0.4)",
            backdropFilter: "blur(12px)",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#3e6090",
          }}
        >
          Run All 37 Engines →
        </button>
      </div>
    </div>
  );
}
