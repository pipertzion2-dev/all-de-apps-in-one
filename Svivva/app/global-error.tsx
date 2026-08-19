"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ZZAI global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            zzai zzai
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "12px 0 8px" }}>
            This page couldn&apos;t load
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.75, marginBottom: 24 }}>
            Something went wrong while loading the app. Reload to try again, or go back to the
            homepage.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                border: "none",
                borderRadius: 8,
                padding: "12px 16px",
                fontWeight: 600,
                background: "#5B8DA8",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Reload
            </button>
            <a
              href="/"
              style={{
                display: "inline-block",
                borderRadius: 8,
                padding: "12px 16px",
                fontWeight: 500,
                color: "#fafafa",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
