const glass = {
  background: "color-mix(in srgb,var(--success) 5%,rgba(255,255,255,0.78))",
  backdropFilter: "blur(14px) saturate(160%)",
  WebkitBackdropFilter: "blur(14px) saturate(160%)",
  border: "1px solid color-mix(in srgb,var(--success) 18%,rgba(255,255,255,0.5))",
  borderRadius: 14,
  padding: "16px 18px",
  boxShadow: "0 4px 20px color-mix(in srgb,var(--success) 8%,transparent)",
};

export function RemedyCard({ remedy }) {
  if (!remedy)
    return (
      <section style={glass}>
        <header style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "color-mix(in srgb,var(--success) 14%,rgba(255,255,255,0.7))",
              fontSize: 13,
              color: "var(--success)",
            }}
          >
            ✦
          </span>
          <h2 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--text)" }}>Remedy</h2>
        </header>
        <div
          style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 11 }}
        >
          No remedy yet
        </div>
      </section>
    );

  return (
    <section style={glass}>
      <header
        style={{
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "color-mix(in srgb,var(--success) 14%,rgba(255,255,255,0.7))",
              fontSize: 13,
              color: "var(--success)",
            }}
          >
            ✦
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "0.02em",
            }}
          >
            Remedy
          </h2>
        </div>
        <span
          style={{
            fontSize: 9,
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Fix + architecture
        </span>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {remedy.fix && (
          <div
            style={{
              borderRadius: 9,
              padding: "10px 12px",
              background: "color-mix(in srgb,var(--success) 9%,rgba(255,255,255,0.7))",
              border: "1px solid color-mix(in srgb,var(--success) 18%,transparent)",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 9,
                fontWeight: 700,
                color: "var(--success)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Fix
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--text)", lineHeight: 1.6 }}>
              {remedy.fix}
            </p>
          </div>
        )}
        {remedy.explanation && (
          <div
            style={{
              borderRadius: 9,
              padding: "10px 12px",
              background: "color-mix(in srgb,var(--accent) 7%,rgba(255,255,255,0.7))",
              border: "1px solid color-mix(in srgb,var(--accent) 16%,transparent)",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 9,
                fontWeight: 700,
                color: "var(--accent)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Why it happens
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 }}>
              {remedy.explanation}
            </p>
          </div>
        )}
        {remedy.improved_architecture && (
          <div
            style={{
              borderRadius: 9,
              padding: "10px 12px",
              background: "color-mix(in srgb,var(--primary) 7%,rgba(255,255,255,0.7))",
              border: "1px solid color-mix(in srgb,var(--primary) 16%,transparent)",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontSize: 9,
                fontWeight: 700,
                color: "var(--primary)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              Improved architecture
            </p>
            <p style={{ margin: 0, fontSize: 11.5, color: "var(--muted)", lineHeight: 1.6 }}>
              {remedy.improved_architecture}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
