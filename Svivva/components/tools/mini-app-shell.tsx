import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import {
  TentpoleStickyBar,
  TentpoleBanner,
  TentpoleStepIndicator,
} from "@/app/components/tentpole-upgrade-cta";
import type { FeatureMiniApp } from "@/lib/tools/feature-mini-apps";

export function MiniAppShell({
  app,
  children,
  nextLabel,
}: {
  app: FeatureMiniApp;
  children: ReactNode;
  nextLabel: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: app.name,
            url: `https://zzaizzai.com${app.path}`,
            description: app.description,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />
      <div className="bg-gradient-to-br from-[#0f1117] to-[#1a2035] border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-white/40">
              <Link href="/tools" className="hover:text-white/70 transition-colors">
                Free Tools
              </Link>
              <span>/</span>
              <span className="text-white/60">{app.name}</span>
            </div>
            <TentpoleStepIndicator
              step={0}
              total={2}
              currentLabel="Free slice"
              nextLabel={nextLabel}
            />
          </div>
          <h1 className="text-3xl font-black text-white">{app.name}</h1>
          <p className="text-white/60 mt-2 text-lg max-w-2xl">{app.description}</p>
          <p className="text-white/40 text-sm mt-2">{app.sliceNote} Free — no signup.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60">Free</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-white/60">
              No signup
            </span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-[#5B8DA8]/20 text-[#9ec9dc]">
              Slice of {app.parentLabel}
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <TentpoleBanner
          headline={`${app.name} is Step 1.`}
          body={`Step 2 lives on ${app.parentLabel} at zzaizzai.com.`}
          href={app.parentHref}
          ctaText={`Open ${app.parentLabel}`}
        />
        {children}
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Frequently asked questions</h2>
          {[
            {
              q: `Is ${app.name} free?`,
              a: `Yes. ${app.name} is free on zzaizzai.com with no signup. It is a one-job slice, not the full ${app.parentLabel} product.`,
            },
            {
              q: `What does this mini-app not do?`,
              a: app.sliceNote,
            },
            {
              q: `Where do I continue after this preview?`,
              a: `Open ${app.parentLabel} on zzaizzai.com, or start at the homepage cube. Orbit indexes this URL so search engines send people to ZZAI.`,
            },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-sm">{q}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
        <div className="text-center pt-2">
          <p className="text-sm text-muted-foreground">Continue on ZZAI</p>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            <Link
              href={app.parentHref}
              className="text-sm px-3 py-1.5 rounded-lg border border-[#5B8DA8]/40 hover:bg-[#5B8DA8]/10 transition-colors"
            >
              {app.parentLabel}
            </Link>
            <Link
              href="/tools"
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors inline-flex items-center gap-1"
            >
              All tools <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href="/"
              className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              zzaizzai.com
            </Link>
          </div>
        </div>
      </div>
      <TentpoleStickyBar
        toolName={app.slug}
        savingsLine={`${app.name} is Step 1. Continue on ${app.parentLabel}.`}
      />
    </div>
  );
}
