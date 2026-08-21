"use client";

import { OrbitSeoManager } from "@/components/orbit/seo-manager";

export default function OrbitSeoPage() {
  return (
    <div className="px-4 sm:px-6 py-8 pb-16 max-w-5xl mx-auto space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Orbit Admin · SEO
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-1">
          SEO &amp; Indexing Manager
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          Automatically prepare every publicly published mini-app for discovery — metadata,
          crawlable landings, sitemap, checks, and Search Console snapshots inside Orbit.
        </p>
      </div>
      <OrbitSeoManager />
    </div>
  );
}
