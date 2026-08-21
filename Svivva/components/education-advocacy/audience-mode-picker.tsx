"use client";

import Link from "next/link";
import { Bot, HandHeart, UserRound } from "lucide-react";
import type { AdvocacyAudienceMode } from "@/lib/education-advocacy/admin-seed-case";
import { AUDIENCE_MODE_COPY } from "@/lib/education-advocacy/admin-seed-case";

const ICONS: Record<AdvocacyAudienceMode, typeof UserRound> = {
  my_situation: UserRound,
  helping_someone: HandHeart,
  explore_tools: Bot,
};

export function AudienceModePicker({
  value,
  onChange,
  showExplore = true,
}: {
  value: AdvocacyAudienceMode;
  onChange: (mode: AdvocacyAudienceMode) => void;
  showExplore?: boolean;
}) {
  const modes = showExplore
    ? (["my_situation", "helping_someone", "explore_tools"] as const)
    : (["my_situation", "helping_someone"] as const);

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {modes.map((mode) => {
        const Icon = ICONS[mode];
        const copy = AUDIENCE_MODE_COPY[mode];
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`text-left rounded-xl border p-3.5 transition-colors space-y-1.5 ${
              selected
                ? "border-[#5B8DA8]/60 bg-[#5B8DA8]/12"
                : "border-border/50 bg-background/30 hover:bg-muted/30"
            }`}
          >
            <Icon className={`w-4 h-4 ${selected ? "text-[#5B8DA8]" : "text-muted-foreground"}`} />
            <p className="text-sm font-medium leading-snug">{copy.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{copy.blurb}</p>
          </button>
        );
      })}
    </div>
  );
}

export function ExploreToolsStrip() {
  const links = [
    { label: "AI Advocacy Guide", href: "/dashboard/education-advocacy/chat" },
    { label: "Know My Rights", href: "/dashboard/education-advocacy/rights" },
    { label: "Timeline tools", href: "/dashboard/education-advocacy/timeline" },
    { label: "Evidence Vault", href: "/dashboard/education-advocacy/vault" },
    { label: "People who can help", href: "/dashboard/education-advocacy/help" },
  ];
  return (
    <div className="rounded-lg border border-border/50 bg-background/30 p-4 space-y-2">
      <p className="text-sm font-medium">Explore without a full story</p>
      <p className="text-xs text-muted-foreground">
        Open any tool to learn how advocacy support works. You can add a situation later.
      </p>
      <div className="flex flex-wrap gap-2 pt-1">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-xs px-2.5 py-1.5 rounded-md border border-border/60 hover:bg-muted/40 transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function AdminSeedButton({
  isAdmin,
  onLoad,
  loaded,
}: {
  isAdmin: boolean;
  onLoad: () => void;
  loaded?: boolean;
}) {
  if (!isAdmin) return null;
  return (
    <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-3 space-y-2">
      <p className="text-xs font-medium text-amber-100/90">Admin only</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Your personal reference case stays here — it is not the default for other users.
      </p>
      <button
        type="button"
        onClick={onLoad}
        className="text-xs px-2.5 py-1.5 rounded-md border border-amber-500/40 hover:bg-amber-500/10 transition-colors"
      >
        {loaded ? "Reload admin reference case" : "Load admin reference case"}
      </button>
    </div>
  );
}
