"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { AdminCodeForm } from "@/components/admin-code-form";
import { BurnsSystemGraph } from "@/components/burns-system-graph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import zzaiLogo from "@/attached_assets/ZZAI_OFFICIAL_LOGO.png";

/**
 * Burns System — admin code first (no account sign-in required).
 */
export default function BurnsPage() {
  const { data, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (!data?.isAdmin) {
    return (
      <div className="min-h-[100svh] flex flex-col bg-background">
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src={zzaiLogo} alt="zzai zzai" width={32} height={32} className="h-8 w-8" />
            <span className="text-xs font-bold tracking-wide text-muted-foreground">
              Burns System
            </span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orbit">Orbit Admin</Link>
          </Button>
        </header>
        <div className="flex flex-1 items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[#6B2C4E]/15 border border-[#6B2C4E]/30">
                <Flame className="h-5 w-5 text-[#6B2C4E]" />
              </div>
              <CardTitle>Burns System</CardTitle>
              <CardDescription>
                Enter your admin passcode — no account sign-in needed. This runs every ZZAI feature
                against zzaizzai.com on a daily graph schedule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminCodeForm
                title="Admin code"
                description="Same code as Orbit Admin and Google Search Console setup."
                onSuccess={() => window.location.reload()}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-background">
      <header className="h-14 border-b border-border/50 flex items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src={zzaiLogo} alt="zzai zzai" width={32} height={32} className="h-8 w-8" />
          <span className="text-xs font-bold tracking-wide">Burns System</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orbit">Orbit Admin</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>
      </header>
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
    </div>
  );
}
