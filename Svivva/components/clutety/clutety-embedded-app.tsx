"use client";

import { useState } from "react";
import { LockScanner } from "@/components/clutety/lock-scanner";
import { FeedShield } from "@/components/clutety/feed-shield";
import { CLUTETY_TEAL } from "@/lib/clutety/config";

type Tab = "scanner" | "feeds";

export function ClutetyEmbeddedApp() {
  const [tab, setTab] = useState<Tab>("scanner");

  return (
    <div className="flex flex-col h-full min-h-[560px]">
      <div
        className="flex shrink-0 border-b"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          background: "rgba(0,0,0,0.35)",
        }}
      >
        {(
          [
            { id: "scanner" as const, label: "Shield Scanner", sub: "Pyracrypt lock UI" },
            { id: "feeds" as const, label: "Feed Shield", sub: "YouTube & social" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="flex-1 px-4 py-3 text-left transition-colors"
            style={{
              borderBottom: tab === t.id ? `2px solid ${CLUTETY_TEAL}` : "2px solid transparent",
              background: tab === t.id ? "rgba(91,168,160,0.08)" : "transparent",
            }}
          >
            <span
              className="block text-xs font-bold tracking-wide"
              style={{ color: tab === t.id ? CLUTETY_TEAL : "rgba(255,255,255,0.5)" }}
            >
              {t.label}
            </span>
            <span className="block text-[10px] text-white/30 mt-0.5">{t.sub}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden rounded-b-xl">
        {tab === "scanner" ? <LockScanner /> : <FeedShield />}
      </div>
    </div>
  );
}
