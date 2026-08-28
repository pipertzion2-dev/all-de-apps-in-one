"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { AdminCodeForm } from "@/components/admin-code-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import zzaiLogo from "@/attached_assets/ZZAI_OFFICIAL_LOGO.png";

function safeRedirect(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

/**
 * Private admin entry — bookmark this URL; passcode is never shown on public pages.
 */
export default function AdminAccessPage() {
  const [redirectTo, setRedirectTo] = useState("/dashboard");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(safeRedirect(params.get("redirect")));
  }, []);

  const { data, isLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    retry: false,
  });

  useEffect(() => {
    if (data?.isAdmin) {
      window.location.replace(redirectTo);
    }
  }, [data?.isAdmin, redirectTo]);

  if (isLoading || data?.isAdmin) {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] flex flex-col bg-background">
      <header className="h-14 border-b border-border/50 flex items-center px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src={zzaiLogo} alt="zzai zzai" width={32} height={32} className="h-8 w-8" />
          <span className="text-xs font-bold tracking-wide text-muted-foreground">
            Owner access
          </span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <CardTitle>Admin passcode</CardTitle>
            <CardDescription>
              Enter your owner passcode to unlock the full dashboard — Orbit, Burns, Google Search
              Console, and admin tools. No user account required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AdminCodeForm
              title="Owner passcode"
              description="Six-digit admin passcode."
              onSuccess={() => {
                window.location.href = redirectTo;
              }}
            />
            <Link href="/login" className="block">
              <Button variant="ghost" className="w-full text-muted-foreground">
                User sign in instead
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
