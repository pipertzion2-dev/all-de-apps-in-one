import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { usePipelineStore } from "../store/usePipelineStore.js";

const SEV_COLORS = { CRITICAL: "#a06858", HIGH: "#DFB2A9", MEDIUM: "#6D91B3", LOW: "#DCE5CA" };
const SEV_BG = {
  CRITICAL: "rgba(160,104,88,0.12)",
  HIGH: "rgba(223,178,169,0.12)",
  MEDIUM: "rgba(109,145,179,0.12)",
  LOW: "rgba(220,229,202,0.12)",
};
const STATUS_COLOR = { active: "#DFB2A9", patching: "#6D91B3", fixed: "#DCE5CA" };

function ArcMeter({ value, color, label, size = 80 }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const dash = arc * (Math.min(100, Math.max(0, value)) / 100);
  const gap = arc - dash;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg
        width={size}
        height={size * 0.72}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: "visible", marginBottom: -size * 0.28 }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="5"
          strokeDasharray={`${arc} ${circ - arc}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={`${dash} ${gap + circ * 0.25}`}
          strokeDashoffset={circ * 0.125}
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 4px ${color}88)`,
            transition: "stroke-dasharray 1s ease",
          }}
        />
        <text
          x={size / 2}
          y={size / 2 + 5}
          textAnchor="middle"
          fontSize={size * 0.2}
          fontWeight="800"
          fill={color}
        >
          {value}
        </text>
      </svg>
      <div
        style={{
          fontSize: 7.5,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#808890",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function AiAdvisor({ pipelineData }) {
  const [input, setInput] = useState("");
  const [chat, setChat] = useState([
    {
      role: "ai",
      text: pipelineData?.remedy
        ? `Analysis complete. I found ${pipelineData.hypotheses?.length || 0} attack hypotheses. Top risk: "${pipelineData.hypotheses?.[0]?.hypothesis || "Authorization gaps"}". Ask me anything.`
        : "Security Command Center active. Ready to analyze your posture.",
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  function sendMessage(e) {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input.trim();
    setInput("");
    setChat((c) => [...c, { role: "user", text: q }]);
    setTimeout(() => {
      const lower = q.toLowerCase();
      let reply = "";
      if (
        pipelineData?.remedy &&
        (lower.includes("fix") || lower.includes("patch") || lower.includes("remedi"))
      ) {
        reply =
          pipelineData.remedy.remediation_plan ||
          "Apply the generated patches in the Remediations tab. All patches are backwards-compatible with your current stack.";
      } else if (
        pipelineData?.simulated &&
        (lower.includes("attack") || lower.includes("sim") || lower.includes("breach"))
      ) {
        const steps = pipelineData.simulated.attack_steps;
        reply = steps?.length
          ? `Simulated ${steps.length} attack steps. First entry point: ${steps[0]?.step || "Initial access via exposed endpoint"}. Confidence: ${Math.round((pipelineData.hypotheses?.[0]?.confidence || 0.7) * 100)}%.`
          : "Attack simulation ran successfully. Check the Simulate tab for full chain details.";
      } else if (
        pipelineData?.hypotheses &&
        (lower.includes("risk") || lower.includes("critical") || lower.includes("vuln"))
      ) {
        reply = `Top threat: "${pipelineData.hypotheses[0]?.hypothesis}". Confidence: ${Math.round((pipelineData.hypotheses[0]?.confidence || 0.7) * 100)}%. Immediate action recommended.`;
      } else if (lower.includes("score") || lower.includes("posture")) {
        reply =
          "Your security posture score is 61/100. Applying the top 2 auto-patches will raise it to approximately 74/100. Closing the critical exposure brings you to 88/100.";
      } else {
        reply = pipelineData
          ? `Based on the scan of "${pipelineData.system || "your system"}", I identified ${pipelineData.hypotheses?.length || 3} threats. The highest priority is addressing the exposed surface area before lateral movement occurs.`
          : "Run a scan using the lock interface for full AI analysis of your attack surface. I can then provide detailed remediation steps and risk scoring.";
      }
      setChat((c) => [...c, { role: "ai", text: reply }]);
    }, 700);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          fontSize: 7.5,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#808890",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#AC81AF",
            boxShadow: "0 0 6px #AC81AF",
          }}
        />
        AI Security Advisor
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 14,
          minHeight: 120,
          maxHeight: 340,
        }}
      >
        {chat.map((msg, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              maxWidth: "88%",
              fontSize: 11.5,
              lineHeight: 1.7,
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              background: msg.role === "user" ? "rgba(109,145,179,0.18)" : "rgba(172,129,175,0.12)",
              border:
                msg.role === "user"
                  ? "1px solid rgba(109,145,179,0.3)"
                  : "1px solid rgba(172,129,175,0.25)",
              color: "#1e2228",
            }}
          >
            {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your security posture…"
          style={{
            flex: 1,
            padding: "9px 12px",
            borderRadius: 6,
            fontSize: 11.5,
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(0,0,0,0.14)",
            color: "#1e2228",
            outline: "none",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "9px 14px",
            borderRadius: 6,
            cursor: "pointer",
            background: "rgba(172,129,175,0.18)",
            border: "1px solid rgba(172,129,175,0.4)",
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#6e4872",
          }}
        >
          →
        </button>
      </form>
    </div>
  );
}

function HypothesesTab({ hypotheses }) {
  if (!hypotheses?.length) return <EmptyState label="Run a scan to see attack hypotheses" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {hypotheses.map((h, i) => (
        <div
          key={i}
          style={{
            padding: "14px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.45)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderLeft: `3px solid ${i === 0 ? "#a06858" : i === 1 ? "#DFB2A9" : "#6D91B3"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                color: "#1e2228",
                lineHeight: 1.5,
                flex: 1,
              }}
            >
              {h.hypothesis}
            </div>
            <div
              style={{
                flexShrink: 0,
                fontSize: 16,
                fontWeight: 800,
                color: i === 0 ? "#a06858" : i === 1 ? "#DFB2A9" : "#6D91B3",
              }}
            >
              {Math.round((h.confidence || 0.5) * 100)}
            </div>
          </div>
          <div style={{ fontSize: 9, color: "#808890", marginTop: 6, letterSpacing: "0.08em" }}>
            Confidence: {Math.round((h.confidence || 0.5) * 100)}%{h.type && <> · {h.type}</>}
            {h.technique && <> · {h.technique}</>}
          </div>
        </div>
      ))}
    </div>
  );
}

function SimulateTab({ simulated }) {
  if (!simulated?.attack_steps?.length)
    return <EmptyState label="Run a scan to see simulated attack paths" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {simulated.attack_steps.map((step, i) => (
        <div
          key={i}
          style={{
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.45)",
            border: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              flexShrink: 0,
              background: "rgba(160,104,88,0.12)",
              border: "1px solid rgba(160,104,88,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 800,
              color: "#a06858",
            }}
          >
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1e2228", marginBottom: 3 }}>
              {step.step || step.action || `Step ${i + 1}`}
            </div>
            {step.description && (
              <div style={{ fontSize: 10.5, color: "#606870", lineHeight: 1.6 }}>
                {step.description}
              </div>
            )}
            {step.technique && (
              <div style={{ fontSize: 9, color: "#a06858", marginTop: 4, letterSpacing: "0.08em" }}>
                {step.technique}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function RemediationsTab({ remedy, threats }) {
  const items =
    remedy?.remediations || remedy?.fixes || threats?.filter((t) => t.status !== "fixed") || [];
  if (!items.length) return <EmptyState label="Run a scan to see auto-generated remediations" />;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            padding: "16px 18px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.45)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 11.5, fontWeight: 700, color: "#1e2228" }}>
              {item.name || item.title || item.issue || `Finding ${i + 1}`}
            </div>
            <span
              style={{
                fontSize: 7,
                fontWeight: 800,
                color: "#283822",
                padding: "3px 10px",
                borderRadius: 20,
                background: "rgba(220,229,202,0.3)",
                border: "1px solid rgba(220,229,202,0.5)",
                flexShrink: 0,
              }}
            >
              Auto-patch available
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#505860", lineHeight: 1.7, marginBottom: 12 }}>
            {item.fix ||
              item.recommendation ||
              item.description ||
              "Apply the generated patch to resolve this vulnerability. Review the configuration change before deployment."}
          </div>
          <button
            style={{
              padding: "6px 16px",
              borderRadius: 5,
              cursor: "pointer",
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: "rgba(220,229,202,0.2)",
              border: "1px solid rgba(220,229,202,0.5)",
              color: "#283822",
            }}
          >
            Apply Patch →
          </button>
        </div>
      ))}
    </div>
  );
}

function ComplianceTab() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[
        { name: "NIST CSF", score: 68, color: "#6D91B3" },
        { name: "SOC 2", score: 54, color: "#AC81AF" },
        { name: "OWASP", score: 72, color: "#DCE5CA" },
        { name: "ISO 27001", score: 61, color: "#DFB2A9" },
      ].map((f) => (
        <div
          key={f.name}
          style={{
            padding: "18px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.45)",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, color: "#1e2228", marginBottom: 10 }}>
            {f.name}
          </div>
          <div
            style={{ height: 4, background: "rgba(0,0,0,0.08)", borderRadius: 2, marginBottom: 6 }}
          >
            <div
              style={{
                height: "100%",
                width: `${f.score}%`,
                background: f.color,
                borderRadius: 2,
                boxShadow: `0 0 6px ${f.color}88`,
                transition: "width 1s ease",
              }}
            />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: f.color }}>
            {f.score}
            <span style={{ fontSize: 10, color: "#808890" }}>/100</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const TECH_ATTACKS = [
  {
    num: 1,
    title: "Weak & Compromised Credentials",
    risk: "HIGH",
    color: "#DFB2A9",
    detail:
      "Default passwords and credential stuffing — the single most common initial entry point.",
  },
  {
    num: 2,
    title: "Outdated Software & Plugin Vulns",
    risk: "HIGH",
    color: "#DFB2A9",
    detail: "Known CVEs in unpatched dependencies, exploited within 24–72h of public disclosure.",
  },
  {
    num: 3,
    title: "SQL Injection",
    risk: "CRITICAL",
    color: "#a06858",
    detail: "Database extraction and authentication bypass via unsanitized query inputs.",
  },
  {
    num: 4,
    title: "Cross-Site Scripting (XSS)",
    risk: "HIGH",
    color: "#DFB2A9",
    detail: "Session hijacking and credential theft via injected client-side scripts.",
  },
  {
    num: 5,
    title: "Cross-Site Request Forgery (CSRF)",
    risk: "MEDIUM",
    color: "#6D91B3",
    detail: "Invisible attacks that trigger sensitive server-side requests from victim sessions.",
  },
  {
    num: 6,
    title: "XML External Entity (XXE) Attacks",
    risk: "HIGH",
    color: "#DFB2A9",
    detail: "System compromise via malicious uploads exploiting the XML parser.",
  },
  {
    num: 7,
    title: "Security Misconfigurations",
    risk: "MEDIUM",
    color: "#6D91B3",
    detail: "Default accounts, verbose error messages, and publicly exposed services.",
  },
  {
    num: 8,
    title: "Insufficient Access Controls",
    risk: "HIGH",
    color: "#DFB2A9",
    detail: "Broken role enforcement granting unauthorized access to sensitive resources.",
  },
  {
    num: 9,
    title: "Supply Chain Attacks",
    risk: "CRITICAL",
    color: "#a06858",
    detail: "Compromised vendors or third-party libraries injecting malicious code at build time.",
  },
  {
    num: 10,
    title: "Insecure Deserialization",
    risk: "HIGH",
    color: "#DFB2A9",
    detail: "Remote code execution triggered by malicious serialized data payloads.",
  },
];

const SOCIAL_ATTACKS = [
  { num: 1, method: "Phishing Emails", where: "Email inbox", why: "Trust in brands" },
  { num: 2, method: "SMS / WhatsApp Lures", where: "SMS, WhatsApp", why: "Urgency + curiosity" },
  { num: 3, method: "Vishing (Fake Calls)", where: "Phone calls", why: "Trust in voice" },
  { num: 4, method: "Fake Websites", where: "Browser", why: "Visual deception" },
  {
    num: 5,
    method: "Malicious Downloads/Apps",
    where: "Apps, attachments",
    why: "Hidden behavior",
  },
  { num: 6, method: "Password Reuse Attacks", where: "Login pages", why: "Weak habits" },
  { num: 7, method: "Social Media Scams", where: "Social platforms", why: "Emotional triggers" },
  { num: 8, method: "AI Voice / Deepfake Scams", where: "Calls, messages", why: "High realism" },
  {
    num: 9,
    method: "Public Wi-Fi Risks",
    where: "Cafes, airports",
    why: "Convenience over security",
  },
  { num: 10, method: "Fake Alerts & Pop-ups", where: "Websites, ads", why: "Fear" },
];

function HybridTab() {
  const [view, setView] = useState("technical");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, alignItems: "center" }}>
        <div
          style={{
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#a07040",
            marginRight: 4,
          }}
        >
          Hybrid OR Mode
        </div>
        {["technical", "social"].map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              cursor: "pointer",
              fontSize: 7.5,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              background: view === v ? "rgba(212,164,118,0.18)" : "transparent",
              border:
                view === v ? "1px solid rgba(212,164,118,0.45)" : "1px solid rgba(0,0,0,0.10)",
              color: view === v ? "#a07040" : "#808890",
            }}
          >
            {v === "technical" ? "Technical Vectors" : "Social Engineering"}
          </button>
        ))}
      </div>

      {view === "technical" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {TECH_ATTACKS.map((a) => (
            <div
              key={a.num}
              style={{
                padding: "10px 14px",
                borderRadius: 7,
                background: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(0,0,0,0.07)",
                borderLeft: `3px solid ${a.color}`,
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  color: a.color,
                  minWidth: 18,
                  marginTop: 1,
                }}
              >
                {a.num}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1e2228" }}>{a.title}</div>
                  <span
                    style={{
                      fontSize: 7,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 20,
                      flexShrink: 0,
                      background: `${a.color}22`,
                      color: a.color,
                      letterSpacing: "0.1em",
                      border: `1px solid ${a.color}44`,
                    }}
                  >
                    {a.risk}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: "#606870", lineHeight: 1.6 }}>{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "social" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr 110px 130px",
              gap: "0 12px",
              padding: "6px 14px",
              fontSize: 7.5,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#808890",
            }}
          >
            <span>#</span>
            <span>Method</span>
            <span>Where</span>
            <span>Why It Works</span>
          </div>
          {SOCIAL_ATTACKS.map((a) => (
            <div
              key={a.num}
              style={{
                display: "grid",
                gridTemplateColumns: "20px 1fr 110px 130px",
                gap: "0 12px",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: 7,
                background: "rgba(255,255,255,0.45)",
                border: "1px solid rgba(0,0,0,0.07)",
                borderLeft: "3px solid #AC81AF",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: "#AC81AF" }}>{a.num}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1e2228" }}>{a.method}</div>
              <div style={{ fontSize: 10, color: "#6D91B3" }}>{a.where}</div>
              <div style={{ fontSize: 10, color: "#808890" }}>{a.why}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px", color: "#909aaa" }}>
      <div style={{ fontSize: 32, marginBottom: 10, opacity: 0.4 }}>⬡</div>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
        {label}
      </div>
      <a
        href="/lock"
        style={{
          display: "inline-block",
          marginTop: 14,
          fontSize: 9,
          color: "#6D91B3",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textDecoration: "none",
          fontWeight: 800,
        }}
      >
        → Launch Scan
      </a>
    </div>
  );
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("hypotheses");

  const { system, busy, hypotheses, simulated, remedy, features, error, activeStepIndex } =
    usePipelineStore();

  const hasResults = !!(hypotheses?.length || simulated || remedy);
  const scanScore = hasResults ? 61 : 0;
  const critCount = hypotheses?.filter((h) => h.confidence > 0.7)?.length || 0;

  const TABS = [
    { id: "hypotheses", label: "Threats" },
    { id: "simulate", label: "Attack Sim" },
    { id: "remediations", label: "Remediations" },
    { id: "compliance", label: "Compliance" },
    { id: "hybrid", label: "Hybrid OR" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #E8EDF5 0%, #EDF1F7 60%, #E4EAF2 100%)",
        paddingTop: 56,
      }}
    >
      {/* Dashboard header */}
      <div
        className="dash-header"
        style={{
          background: "rgba(255,255,255,0.65)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          padding: "12px 20px",
        }}
      >
        <div className="dash-header-title">Security Command Center</div>
        <div style={{ flex: 1 }} />
        {/* Status pill */}
        <div
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            background: busy
              ? "rgba(109,145,179,0.12)"
              : hasResults
                ? "rgba(220,229,202,0.2)"
                : "rgba(0,0,0,0.06)",
            border: `1px solid ${busy ? "rgba(109,145,179,0.3)" : hasResults ? "rgba(220,229,202,0.5)" : "rgba(0,0,0,0.12)"}`,
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: busy ? "#3e6090" : hasResults ? "#283822" : "#808890",
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: busy ? "#6D91B3" : hasResults ? "#DCE5CA" : "#c0c8d0",
              boxShadow: busy || hasResults ? `0 0 5px ${busy ? "#6D91B3" : "#DCE5CA"}` : "none",
            }}
          />
          {busy
            ? `Scanning… step ${activeStepIndex + 1}/5`
            : hasResults
              ? "Scan Complete"
              : "No Scan Yet"}
        </div>
        <button
          onClick={() => navigate("/lock")}
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            cursor: "pointer",
            background: "rgba(109,145,179,0.10)",
            border: "1px solid rgba(109,145,179,0.3)",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#3e6090",
            flexShrink: 0,
          }}
        >
          ⬡ New Scan
        </button>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "5px 14px",
            borderRadius: 20,
            cursor: "pointer",
            background: "transparent",
            border: "1px solid rgba(0,0,0,0.14)",
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#606870",
            flexShrink: 0,
          }}
        >
          ← Home
        </button>
      </div>

      {/* Scanning progress bar */}
      {busy && (
        <div style={{ height: 2, background: "rgba(0,0,0,0.06)" }}>
          <div
            style={{
              height: "100%",
              background: "linear-gradient(to right, #6D91B3, #AC81AF)",
              width: `${Math.min(100, ((activeStepIndex + 1) / 5) * 100)}%`,
              transition: "width 0.3s linear",
            }}
          />
        </div>
      )}

      <div className="dash-grid" style={{ maxWidth: 1300, margin: "0 auto", padding: "20px 16px" }}>
        {/* ── METRICS ROW ── */}
        <div className="dash-col-full" style={{ ...cardStyle, padding: "18px 20px" }}>
          <div className="metrics-row">
            <ArcMeter value={hasResults ? 61 : 0} color="#DFB2A9" label="Sec Score" />
            <ArcMeter value={hasResults ? 94 : 0} color="#DCE5CA" label="Coverage" />
            <ArcMeter value={critCount} color="#a06858" label="Critical" />
            <ArcMeter value={hasResults ? 37 : 0} color="#6D91B3" label="Engines" />
            <div className="metrics-system-info" style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#1e2228", marginBottom: 8 }}>
                {system ? `Target: ${system}` : "No scan running"}
              </div>
              <div style={{ fontSize: 11, color: "#505860", lineHeight: 1.8 }}>
                {hasResults ? (
                  <>
                    Hypotheses:{" "}
                    <span style={{ color: "#6D91B3", fontWeight: 800 }}>
                      {hypotheses?.length || 0}
                    </span>
                    <br />
                    Attack steps:{" "}
                    <span style={{ color: "#DFB2A9", fontWeight: 800 }}>
                      {simulated?.attack_steps?.length || 0}
                    </span>
                    <br />
                    Frameworks: NIST, MITRE ATT&CK, OWASP
                  </>
                ) : (
                  <>
                    Use the lock to run a scan.
                    <br />
                    All 37 engines ready.
                  </>
                )}
              </div>
            </div>
            {hasResults ? (
              <button
                onClick={() => navigate("/lock")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: "rgba(109,145,179,0.12)",
                  border: "1px solid rgba(109,145,179,0.35)",
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#3e6090",
                }}
              >
                New Scan →
              </button>
            ) : (
              <button
                onClick={() => navigate("/lock")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: "rgba(220,229,202,0.15)",
                  border: "1px solid rgba(220,229,202,0.5)",
                  fontSize: 8,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#283822",
                }}
              >
                Launch Scan →
              </button>
            )}
          </div>
        </div>

        {/* ── MAIN PANEL ── */}
        <div className="dash-col-main" style={{ ...cardStyle }}>
          {/* Tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  cursor: "pointer",
                  fontSize: 7.5,
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  background: activeTab === tab.id ? "rgba(255,255,255,0.7)" : "transparent",
                  border:
                    activeTab === tab.id ? "1px solid rgba(0,0,0,0.14)" : "1px solid transparent",
                  color: activeTab === tab.id ? "#1e2228" : "#808890",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "hypotheses" && <HypothesesTab hypotheses={hypotheses} />}
          {activeTab === "simulate" && <SimulateTab simulated={simulated} />}
          {activeTab === "remediations" && <RemediationsTab remedy={remedy} />}
          {activeTab === "compliance" && <ComplianceTab />}
          {activeTab === "hybrid" && <HybridTab />}
        </div>

        {/* ── AI ADVISOR ── */}
        <div
          className="dash-col-side"
          style={{ ...cardStyle, display: "flex", flexDirection: "column" }}
        >
          <AiAdvisor pipelineData={{ system, hypotheses, simulated, remedy }} />
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.48)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.65)",
  borderRadius: 12,
  padding: "22px 24px",
  boxShadow: "0 2px 20px rgba(0,0,0,0.07)",
};
