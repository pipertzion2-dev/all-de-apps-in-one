"use client";

import { useState } from "react";
import { Layers, Rss, Scan, Shield } from "lucide-react";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedShield } from "@/components/clutety/feed-shield";
import { LockScanner } from "@/components/clutety/lock-scanner";
import { ClutetyAppFrame } from "@/components/clutety/clutety-app-frame";
import SecurityPQCConstructor from "@/components/security-pqc-constructor";
import { ZZAI_SECURITY_NAME, ZZAI_SECURITY_TAGLINE } from "@/lib/zzai-security/config";

export default function SecurityDashboardPage() {
  const [tab, setTab] = useState("feeds");

  return (
    <FeaturePageShell
      variant="security"
      subtitle={`${ZZAI_SECURITY_TAGLINE} Former standalone Pyracrypt is embedded here — one login, one domain.`}
      className="pb-6"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col gap-6 pb-4">
        <div className="rounded-xl border border-[#5B8DA8]/25 bg-[#5B8DA8]/5 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{ZZAI_SECURITY_NAME}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Feed Shield, threat scanning, PQC proofs, and the full protection suite — no separate
            Pyracrypt host. Public free tools still live at{" "}
            <a href="/cyber-security-mini-apps" className="text-[#5B8DA8] hover:underline">
              /cyber-security-mini-apps
            </a>
            .
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="feeds" className="gap-2">
              <Rss className="w-4 h-4" />
              Feed Shield
            </TabsTrigger>
            <TabsTrigger value="scan" className="gap-2">
              <Scan className="w-4 h-4" />
              Threat Scanner
            </TabsTrigger>
            <TabsTrigger value="pqc" className="gap-2">
              <Shield className="w-4 h-4" />
              PQC Proofs
            </TabsTrigger>
            <TabsTrigger value="suite" className="gap-2">
              <Layers className="w-4 h-4" />
              Security Suite
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="feeds"
            className="mt-4 rounded-xl border bg-card/80 backdrop-blur-md overflow-hidden"
          >
            <FeedShield />
          </TabsContent>

          <TabsContent
            value="scan"
            className="mt-4 rounded-xl border bg-card/80 backdrop-blur-md overflow-hidden min-h-[640px]"
          >
            <LockScanner />
          </TabsContent>

          <TabsContent value="pqc" className="mt-4">
            <SecurityPQCConstructor />
          </TabsContent>

          <TabsContent value="suite" className="mt-4">
            <div className="rounded-xl border bg-card/80 backdrop-blur-md overflow-hidden min-h-[640px]">
              <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
                <p className="text-sm font-semibold">Embedded protection suite</p>
                <p className="text-xs text-muted-foreground">
                  Full hypothesis → simulate → remedy pipeline from the legacy Pyracrypt build,
                  hosted on ZZAI.
                </p>
              </div>
              <ClutetyAppFrame height="min(78vh, 760px)" />
            </div>
          </TabsContent>
        </Tabs>

        <div className="rounded-xl border border-[#5B8DA8]/25 bg-[#5B8DA8]/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Poor Man Protection</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seal sketches with dual-axis hybridization, a protection coin, and cyber integrity —
              then watch threats here.
            </p>
          </div>
          <a
            href="/dashboard/poor-man-protection"
            className="inline-flex items-center justify-center h-9 px-4 rounded-lg text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #5B8DA8, #6B2C4E)" }}
          >
            Open protection
          </a>
        </div>
      </div>
    </FeaturePageShell>
  );
}
