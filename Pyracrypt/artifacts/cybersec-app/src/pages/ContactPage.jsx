import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "", type: "demo" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #EEF2F8 0%, #F4F7FC 60%, #E8EDF5 100%)",
        paddingTop: 80,
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "60px 80px" }}>
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
            Contact
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
            fontSize: "clamp(32px,4.5vw,64px)",
            fontWeight: 800,
            color: "#1e2228",
            textTransform: "uppercase",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            margin: "0 0 14px",
          }}
        >
          Let's talk
          <br />
          <span
            style={{
              backgroundImage:
                "linear-gradient(135deg, #3e6090 0%, #6D91B3 40%, #a0c0d8 60%, #6D91B3 80%, #3e6090 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            security.
          </span>
        </h1>

        <p
          style={{
            fontSize: 13.5,
            color: "#505860",
            lineHeight: 1.9,
            maxWidth: 480,
            marginBottom: 52,
          }}
        >
          Whether you're a solo developer, a startup, or an enterprise security team — Wavy is built
          for you. Reach out and we'll get you set up fast.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: 48,
            alignItems: "start",
          }}
        >
          {sent ? (
            <div
              style={{
                background: "rgba(255,255,255,0.50)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(220,229,202,0.5)",
                borderRadius: 12,
                padding: "52px 40px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 16 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e2228", marginBottom: 10 }}>
                Message received
              </div>
              <p style={{ fontSize: 12.5, color: "#505860", lineHeight: 1.8, margin: 0 }}>
                We'll be in touch within one business day. In the meantime, you can explore the
                dashboard.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
              {/* Type selector */}
              <div>
                <label style={labelStyle}>I want to</label>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  {["demo", "trial", "enterprise", "general"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        cursor: "pointer",
                        fontSize: 8,
                        fontWeight: 800,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        background:
                          form.type === t ? "rgba(109,145,179,0.18)" : "rgba(255,255,255,0.4)",
                        border:
                          form.type === t ? "1.5px solid #6D91B3" : "1px solid rgba(0,0,0,0.12)",
                        color: form.type === t ? "#3e6090" : "#606870",
                        backdropFilter: "blur(8px)",
                        transition: "all 0.15s",
                      }}
                    >
                      {t === "demo"
                        ? "Book a demo"
                        : t === "trial"
                          ? "Start a trial"
                          : t === "enterprise"
                            ? "Enterprise"
                            : "General inquiry"}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input
                    style={inputStyle}
                    placeholder="Jane Smith"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Work email</label>
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="jane@company.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Company</label>
                <input
                  style={inputStyle}
                  placeholder="Acme Corp"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                />
              </div>

              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  style={{ ...inputStyle, height: 110, resize: "vertical" }}
                  placeholder="Tell us about your setup and what you're trying to solve…"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "13px 32px",
                  borderRadius: 6,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  background: "rgba(220,229,202,0.18)",
                  border: "1px solid rgba(220,229,202,0.55)",
                  backdropFilter: "blur(12px)",
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "#283822",
                }}
              >
                Send Message →
              </button>
            </form>
          )}

          {/* Side info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { label: "Response time", value: "< 1 business day", color: "#DCE5CA" },
              {
                label: "Works for",
                value: "Solo devs, startups, SMBs, enterprise",
                color: "#6D91B3",
              },
              { label: "No commitment", value: "Start with a free scan session", color: "#AC81AF" },
              { label: "Based in", value: "San Francisco, CA", color: "#DFB2A9" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "rgba(255,255,255,0.40)",
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${item.color}33`,
                  borderLeft: `3px solid ${item.color}`,
                  borderRadius: 6,
                  padding: "16px 20px",
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#808890",
                    marginBottom: 6,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1e2228" }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#606870",
  display: "block",
  marginBottom: 6,
};
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 6,
  fontSize: 12,
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(8px)",
  border: "1px solid rgba(0,0,0,0.14)",
  color: "#1e2228",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};
