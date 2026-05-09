const glass = {
  background: "color-mix(in srgb,var(--primary) 5%,rgba(255,255,255,0.78))",
  backdropFilter: "blur(14px) saturate(160%)",
  WebkitBackdropFilter: "blur(14px) saturate(160%)",
  border: "1px solid color-mix(in srgb,var(--primary) 20%,rgba(255,255,255,0.6))",
  borderRadius: 14,
  padding: "16px 18px",
  boxShadow: "0 4px 20px color-mix(in srgb,var(--primary) 10%,transparent)",
};

export function InsightCard({ hypotheses, explanation }) {
  const empty = !hypotheses?.length && !explanation;
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
              background: "color-mix(in srgb,var(--primary) 14%,rgba(255,255,255,0.7))",
              fontSize: 13,
              color: "var(--primary)",
            }}
          >
            ◈
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
            Insight
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
          Hypotheses + synthesis
        </span>
      </header>
      {empty ? (
        <div
          style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 11 }}
        >
          Run pipeline to see insights
        </div>
      ) : (
        <>
          {explanation && (
            <p
              style={{
                fontSize: 11.5,
                color: "var(--text2)",
                lineHeight: 1.7,
                marginBottom: 12,
                padding: "10px 12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.55)",
              }}
            >
              {explanation}
            </p>
          )}
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            {(hypotheses || []).slice(0, 5).map((h, i) => (
              <li
                key={i}
                style={{
                  borderRadius: 8,
                  padding: "9px 12px",
                  background: "color-mix(in srgb,var(--primary) 7%,rgba(255,255,255,0.6))",
                  border: "1px solid color-mix(in srgb,var(--primary) 14%,transparent)",
                }}
              >
                <p style={{ margin: 0, fontSize: 11.5, color: "var(--text)", lineHeight: 1.55 }}>
                  {h.hypothesis}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 10,
                    color: "var(--primary)",
                    fontWeight: 700,
                  }}
                >
                  Confidence {(h.confidence * 100).toFixed(0)}%
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
