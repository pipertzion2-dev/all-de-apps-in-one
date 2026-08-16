"use client";

import { useState } from "react";
import { Shield, Rss, Scan } from "lucide-react";
import { FeaturePageShell } from "@/components/feature-page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedShield } from "@/components/clutety/feed-shield";
import { LockScanner } from "@/components/clutety/lock-scanner";
import SecurityPQCConstructor from "@/components/security-pqc-constructor";

export default function SecurityDashboardPage() {
  const [tab, setTab] = useState("feeds");

  return (
    <FeaturePageShell
      variant="security"
      subtitle="Feed filtering, local file protection, and threat analysis — built into ZZAI."
      className="pb-6"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col gap-6 pb-4">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
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
