"use client";

import { AlertTriangle } from "lucide-react";
import {
  DISCLOSURE_RISK_BANNER,
  scanDisclosureRisk,
} from "@/lib/poor-man-protection/invention-studio/disclosure-risk";

export function DisclosureRiskBanner({ text }: { text: string }) {
  const hits = scanDisclosureRisk(text);
  if (!hits.length) return null;
  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
      <div className="flex gap-2 text-sm font-medium text-amber-100">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        Disclosure risk alert
      </div>
      <ul className="text-xs text-muted-foreground space-y-1.5 pl-6 list-disc">
        {hits.map((h) => (
          <li key={h.phrase}>
            <span className="text-foreground">{h.phrase}</span> — {h.guidance}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground pl-6">{DISCLOSURE_RISK_BANNER}</p>
    </div>
  );
}
