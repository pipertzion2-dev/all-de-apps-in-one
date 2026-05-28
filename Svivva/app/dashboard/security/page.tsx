"use client";

import { useState } from "react";
import { Shield, Rss, Scan } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedShield } from "@/components/clutety/feed-shield";
import { LockScanner } from "@/components/clutety/lock-scanner";

export default function SecurityDashboardPage() {
  const [tab, setTab] = useState("feeds");

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-2 text-primary mb-1">
          <Shield className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-widest">Security</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Security Center</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Feed filtering, local file protection, and threat analysis — built into Svivva. Runs in
          your browser where possible; analysis APIs stay on your workspace.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="feeds" className="gap-2">
            <Rss className="w-4 h-4" />
            Feed Shield
          </TabsTrigger>
          <TabsTrigger value="scan" className="gap-2">
            <Scan className="w-4 h-4" />
            Threat Scanner
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feeds" className="mt-4 rounded-xl border bg-card overflow-hidden">
          <FeedShield />
        </TabsContent>

        <TabsContent value="scan" className="mt-4 rounded-xl border bg-card overflow-hidden min-h-[640px]">
          <LockScanner />
        </TabsContent>
      </Tabs>
    </div>
  );
}
