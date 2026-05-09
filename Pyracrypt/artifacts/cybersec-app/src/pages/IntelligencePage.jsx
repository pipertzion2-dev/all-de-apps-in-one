import { useLocation } from "wouter";

const FEEDS = [
  {
    time: "2m ago",
    sev: "HIGH",
    color: "#DFB2A9",
    title: "Exposed admin endpoint detected",
    system: "api.example.com:8080",
  },
  {
    time: "11m ago",
    sev: "MEDIUM",
    color: "#DCE5CA",
    title: "Outdated TLS 1.1 negotiation",
    system: "auth.example.com",
  },
  {
    time: "23m ago",
    sev: "HIGH",
    color: "#DFB2A9",
    title: "SQL injection surface in /search",
    system: "app.example.com",
  },
  {
    time: "1h ago",
    sev: "INFO",
    color: "#6D91B3",
    title: "New service discovered: redis:6379",
    system: "internal network",
  },
  {
    time: "2h ago",
    sev: "CRITICAL",
    color: "#a06858",
    title: "Unauthenticated S3 bucket exposure",
    system: "cloud storage",
  },
  {
    time: "3h ago",
    sev: "MEDIUM",
    color: "#DCE5CA",
    title: "CORS misconfiguration detected",
    system: "api.example.com",
  },
];

const INTEL = [
  {
    title: "Threat Actor: APT-29",
    color: "#AC81AF",
    desc: "Active campaigns targeting your sector. Primary vector: spear phishing + supply chain compromise. Last seen: 18 hours ago.",
  },
  {
    title: "Zero-Day: CVE-2024-XXXX",
    color: "#DFB2A9",
    desc: "Unpatched vulnerability in your dependency tree. Exploitation in the wild observed. Patch available — auto-remediation ready.",
  },
  {
    title: "Dark Web Mention",
    color: "#6D91B3",
    desc: "Credentials matching your domain pattern listed on breach forum. Recommend immediate password rotation for affected users.",
  },
];

export default function IntelligencePage() {
  const [, navigate] = useLocation();
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
              background: "#AC81AF",
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
            Intelligence
          </span>
          <span
            style={{
              width: 20,
              height: 1.5,
              background: "#AC81AF",
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
          Live threat
          <br />
          <span
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.32'/%3E%3C/svg%3E"),
              linear-gradient(135deg, #6e4872 0%, #AC81AF 28%, #d0aad4 50%, #AC81AF 72%, #6e4872 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
            }}
          >
            intelligence
          </span>
        </h1>

        <p
          style={{
            fontSize: 13.5,
            color: "#505860",
            lineHeight: 1.9,
            maxWidth: 540,
            marginBottom: 52,
          }}
        >
          Real-time threat feeds, dark web monitoring, and AI-synthesized intelligence — all
          correlated against your specific attack surface.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 340px",
            gap: 28,
            alignItems: "start",
          }}
        >
          {/* Live feed */}
          <div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#606870",
                marginBottom: 16,
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
                  background: "#DCE5CA",
                  boxShadow: "0 0 6px #DCE5CA",
                  animation: "pulse 2s infinite",
                }}
              />
              Live Event Feed
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {FEEDS.map((f, i) => (
                <div
                  key={i}
                  style={{
                    background: "rgba(255,255,255,0.40)",
                    backdropFilter: "blur(10px)",
                    border: `1px solid ${f.color}33`,
                    borderLeft: `3px solid ${f.color}`,
                    borderRadius: 6,
                    padding: "14px 18px",
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: 7,
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      color: f.color,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {f.sev}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontSize: 11.5, fontWeight: 700, color: "#1e2228", marginBottom: 3 }}
                    >
                      {f.title}
                    </div>
                    <div style={{ fontSize: 10, color: "#808890" }}>{f.system}</div>
                  </div>
                  <span style={{ fontSize: 9, color: "#a0a8b0", flexShrink: 0 }}>{f.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Intel cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "#606870",
                marginBottom: 4,
              }}
            >
              AI Intel Briefing
            </div>
            {INTEL.map((item) => (
              <div
                key={item.title}
                style={{
                  background: "rgba(255,255,255,0.42)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${item.color}44`,
                  borderRadius: 8,
                  padding: "18px 20px",
                  boxShadow: `0 2px 16px ${item.color}18`,
                }}
              >
                <div style={{ fontSize: 10, fontWeight: 800, color: item.color, marginBottom: 10 }}>
                  {item.title}
                </div>
                <p style={{ fontSize: 11.5, color: "#505860", lineHeight: 1.75, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            ))}

            <button
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "12px 20px",
                borderRadius: 6,
                cursor: "pointer",
                background: "rgba(172,129,175,0.12)",
                border: "1px solid rgba(172,129,175,0.4)",
                backdropFilter: "blur(12px)",
                fontSize: 9,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#6e4872",
                marginTop: 4,
              }}
            >
              View Full Dashboard →
            </button>
          </div>
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }`}</style>
      </div>
    </div>
  );
}
