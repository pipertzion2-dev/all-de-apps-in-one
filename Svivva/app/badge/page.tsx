"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const TEAL = "#5BA8A0";

function CopyBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="rounded-xl border border-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border/50">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3 text-xs font-mono text-foreground/80 overflow-x-auto leading-relaxed whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

export default function BadgePage() {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://svivva.com";
  const badgeUrl = `${baseUrl}/api/badge`;
  const siteUrl = "https://svivva.com";

  const badges = [
    {
      label: "Built with Svivva",
      params: "label=built+with&message=Svivva&color=5BA8A0",
      desc: "Standard — for projects built using the Svivva platform",
    },
    {
      label: "Powered by Svivva",
      params: "label=powered+by&message=Svivva&color=5BA8A0",
      desc: "For apps and tools that use Svivva as their AI backend",
    },
    {
      label: "Ships with Svivva",
      params: "label=Ships+with&message=Svivva&color=6B2C4A",
      desc: "Burgundy variant — highlights a product powered on Svivva",
    },
    {
      label: "Svivva Certified",
      params: "label=Svivva&message=certified&color=5BA8A0",
      desc: "For officially verified Svivva implementations",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-12">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: TEAL }}
          >
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold">Svivva Badge</h1>
        </div>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Add a &ldquo;Built with Svivva&rdquo; badge to your README, website, or app. Shows you
          ship with Svivva — and gives a small backlink in return.
        </p>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-xs"
            style={{ borderColor: `${TEAL}40`, color: TEAL }}
          >
            Free
          </Badge>
          <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
            No signup required
          </Badge>
          <Badge variant="outline" className="text-xs border-border/50 text-muted-foreground">
            SVG format
          </Badge>
        </div>
      </div>

      {/* Badge variants */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
          Badge Variants
        </h2>
        {badges.map((b) => {
          const imgUrl = `${badgeUrl}?${b.params}`;
          const markdownCode = `[![${b.label}](${imgUrl})](${siteUrl}?ref=badge)`;
          const htmlCode = `<a href="${siteUrl}?ref=badge"><img src="${imgUrl}" alt="${b.label}" /></a>`;

          return (
            <div
              key={b.label}
              className="rounded-2xl border border-border/50 bg-card p-5 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt={b.label} className="h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{b.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                </div>
              </div>
              <CopyBlock code={markdownCode} label="Markdown (GitHub README)" />
              <CopyBlock code={htmlCode} label="HTML" />
              <CopyBlock code={imgUrl} label="Direct image URL" />
            </div>
          );
        })}
      </div>

      {/* Custom badge */}
      <div className="rounded-2xl border border-border/50 bg-card p-5 space-y-3">
        <h2 className="text-sm font-bold">Custom Badge</h2>
        <p className="text-xs text-muted-foreground">
          Customize the label, message, and color using URL parameters.
        </p>
        <CopyBlock
          code={`${badgeUrl}?label=your+label&message=your+message&color=5BA8A0`}
          label="Custom badge URL"
        />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <code className="text-foreground">label</code> — left side text (URL-encode spaces as{" "}
            <code>+</code>)
          </p>
          <p>
            <code className="text-foreground">message</code> — right side text
          </p>
          <p>
            <code className="text-foreground">color</code> — hex color without # (default: 5BA8A0)
          </p>
        </div>
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-6 text-center space-y-3"
        style={{ background: `${TEAL}15`, border: `1px solid ${TEAL}30` }}
      >
        <p className="text-sm font-semibold">From seed to symphony</p>
        <p className="text-xs text-muted-foreground">
          Svivva turns plain-language intent into production backends with schema checks, tests,
          versioning, and rollback — from one workspace.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: TEAL }}
        >
          Try Svivva free <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
