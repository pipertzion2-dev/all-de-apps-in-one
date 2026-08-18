"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PiggyBank } from "lucide-react";

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function PiggyBankQuickLink() {
  const { data, isLoading } = useQuery<{ summary: { balance: number; entryCount: number } }>({
    queryKey: ["/api/admin/piggy-bank"],
    queryFn: () =>
      fetch("/api/admin/piggy-bank", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Forbidden");
        return r.json();
      }),
    retry: false,
  });

  const balance = data?.summary.balance ?? 0;
  const entryCount = data?.summary.entryCount ?? 0;

  return (
    <Link href="/dashboard/piggy-bank" className="block">
      <Button
        variant="outline"
        className="gap-2 w-full sm:w-auto border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60"
        data-testid="button-piggy-bank"
      >
        <PiggyBank className="h-4 w-4 text-amber-500" />
        <span>
          Piggy Bank
          {!isLoading && (
            <span className="text-amber-600 dark:text-amber-400 font-semibold ml-1.5">
              {money(balance)}
            </span>
          )}
          {isLoading && <span className="text-muted-foreground ml-1.5">…</span>}
        </span>
        {!isLoading && entryCount > 0 && (
          <span className="text-xs text-muted-foreground ml-1">({entryCount})</span>
        )}
      </Button>
    </Link>
  );
}
