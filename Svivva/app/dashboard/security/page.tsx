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
      subtitle="Feed filtering, local file protection, and threat analysis — built into Svivva."
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

          <TabsContent value="feeds" className="mt-4 rounded-xl border bg-card/80 backdrop-blur-md overflow-hidden">
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
      </div>
    </FeaturePageShell>
  );
}
