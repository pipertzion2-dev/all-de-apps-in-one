"use client";

import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { authFetch } from "@/hooks/use-auth";
import { AdminCodeForm } from "@/components/admin-code-form";
import { BurnsSystemGraph } from "@/components/burns-system-graph";

/**
 * Burns System — admin only. Same gate as Orbit: the admin passcode cookie is
 * what /api/auth/me reports as isAdmin, and every Burns API route re-checks it
 * server-side, so this is UX rather than the security boundary.
 */
export default function BurnsPage() {
  const { data, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="py-16 px-4 text-center text-sm text-muted-foreground">
        Checking admin access…
      </div>
    );
  }

  if (!data?.isAdmin) {
    return (
      <div className="py-16 px-4">
        <AdminCodeForm
          title="Burns System"
          description="Enter the admin code to unlock the Burns System — it runs every ZZAI feature against this site."
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#6B2C4E]/15 border border-[#6B2C4E]/30">
          <Flame className="h-4 w-4 text-[#6B2C4E]" />
        </span>
        <div>
          <h1 className="text-xl font-black text-foreground leading-tight">Burns System</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            ZZAI pointed at itself. Each node is one of this app&apos;s own features run against
            zzaizzai.com, wired into a dependency graph so the morning job builds content before
            indexing it and indexes before measuring it. Runs automatically at 06:00 UTC daily.
          </p>
        </div>
      </div>

      <BurnsSystemGraph />
    </div>
  );
}
