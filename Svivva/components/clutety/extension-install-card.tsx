"use client";

import { Chrome, ExternalLink } from "lucide-react";

const TEAL = "#5BA8A0";

export function ExtensionInstallCard() {
  return (
    <section
      style={{
        marginBottom: 20,
        padding: 14,
        borderRadius: 10,
        background: "rgba(91,168,160,0.06)",
        border: "1px solid rgba(91,168,160,0.25)",
      }}
    >
      <p
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: TEAL,
          margin: "0 0 8px",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Chrome className="w-3.5 h-3.5" /> Block feeds on real social apps
      </p>
      <p
        style={{
          fontSize: 11,
          color: "rgba(255,255,255,0.55)",
          margin: "0 0 10px",
          lineHeight: 1.55,
        }}
      >
        Rules you set here apply on <strong>YouTube</strong>, TikTok, Instagram, X, Reddit,
        Facebook, LinkedIn, and Threads when you install the browser extension. Visit this
        page after saving rules to sync them automatically.
      </p>
      <ol
        style={{
          margin: "0 0 10px",
          paddingLeft: 18,
          fontSize: 11,
          color: "rgba(255,255,255,0.5)",
          lineHeight: 1.6,
        }}
      >
        <li>
          Clone or download the repo folder <code>clutety-browser-extension</code>
        </li>
        <li>Chrome → Extensions → Developer mode → Load unpacked</li>
        <li>Open YouTube (or any supported site) — blocked people & topics disappear from feeds</li>
      </ol>
      <a
        href="https://svivva.com/dashboard/security"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          fontWeight: 700,
          color: TEAL,
        }}
      >
        Re-sync rules from Svivva <ExternalLink className="w-3 h-3" />
      </a>
    </section>
  );
}
