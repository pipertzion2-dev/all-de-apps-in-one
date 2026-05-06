import { useState, useEffect } from "react";

export default function SvivvaAd() {
  const [visible, setVisible] = useState(true);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    // Pulse animation every 4 seconds to draw attention
    const interval = setInterval(() => {
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "rgba(10, 5, 20, 0.55)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid rgba(124,58,237,0.5)",
        boxShadow: "0 -8px 40px rgba(124,58,237,0.25)",
        padding: "0",
        transition: "box-shadow 0.3s",
      }}
    >
      {/* Animated top glow bar */}
      <div
        style={{
          height: "3px",
          background: "linear-gradient(90deg, #7c3aed, #a855f7, #ec4899, #a855f7, #7c3aed)",
          backgroundSize: "200% 100%",
          animation: "gradientShift 3s linear infinite",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "12px 20px",
          maxWidth: "1200px",
          margin: "0 auto",
          flexWrap: "wrap",
        }}
      >
        {/* Logo */}
        <div
          style={{
            flexShrink: 0,
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            overflow: "hidden",
            border: "2px solid #7c3aed",
            boxShadow: pulse
              ? "0 0 24px #a855f7, 0 0 48px #7c3aed"
              : "0 0 12px rgba(124,58,237,0.4)",
            transition: "box-shadow 0.3s",
            background: "#0a0a0f",
          }}
        >
          <img
            src="/svivva-logo.png"
            alt="Svivva"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Badge */}
        <div
          style={{
            flexShrink: 0,
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            padding: "3px 10px",
            borderRadius: "20px",
          }}
        >
          🌱 Svivva Seeds
        </div>

        {/* Copy */}
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "clamp(13px, 2vw, 16px)",
              lineHeight: 1.2,
              marginBottom: "3px",
            }}
          >
            Reach more customers with Svivva's built-in marketing.
          </div>
          <div style={{ color: "#a78bfa", fontSize: "clamp(11px, 1.5vw, 13px)" }}>
            Svivva puts your business in front of an active audience — automated posts, discovery features, and tools that keep customers coming back.
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://svivva.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flexShrink: 0,
            display: "inline-block",
            background: pulse
              ? "linear-gradient(135deg, #a855f7, #ec4899)"
              : "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "14px",
            padding: "10px 22px",
            borderRadius: "8px",
            textDecoration: "none",
            boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
            transition: "all 0.3s",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.05)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 30px rgba(124,58,237,0.8)";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 20px rgba(124,58,237,0.5)";
          }}
        >
          Grow with Svivva →
        </a>

        {/* Dismiss */}
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
          style={{
            flexShrink: 0,
            background: "transparent",
            border: "1px solid #2a2a40",
            color: "#555",
            cursor: "pointer",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            lineHeight: 1,
            transition: "all 0.2s",
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#aaa";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#555";
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.color = "#555";
            (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a40";
          }}
        >
          ✕
        </button>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
