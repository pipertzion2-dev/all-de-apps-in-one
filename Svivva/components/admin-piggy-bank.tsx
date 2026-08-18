"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, Plus, TrendingDown, TrendingUp } from "lucide-react";

interface PiggyBankData {
  summary: {
    balance: number;
    totalIncome: number;
    totalExpenses: number;
    entryCount: number;
  };
  entries: {
    id: string;
    amount: number;
    currency: string;
    type: string;
    category: string | null;
    description: string | null;
    source: string;
    createdAt: string;
  }[];
}

function money(n: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminPiggyBank() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("income");
  const [description, setDescription] = useState("");

  const { data, isLoading, isError } = useQuery<PiggyBankData>({
    queryKey: ["/api/admin/piggy-bank"],
    queryFn: () =>
      fetch("/api/admin/piggy-bank", { credentials: "include" }).then((r) => {
        if (!r.ok) throw new Error("Failed to load piggy bank");
        return r.json();
      }),
  });

  const addEntry = useMutation({
    mutationFn: async () => {
      const parsed = parseFloat(amount);
      if (!parsed || parsed <= 0) throw new Error("Enter a valid amount");

      const res = await fetch("/api/admin/piggy-bank", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsed,
          type,
          description: description.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to add entry");
      }
      return res.json();
    },
    onSuccess: () => {
      setAmount("");
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/piggy-bank"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/overview"] });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">Loading piggy bank…</CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-red-500">
          Could not load piggy bank. Run migration 004_piggy_bank.sql if the table is missing.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-amber-500" />
          Admin piggy bank
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Track revenue manually — works even when Stripe isn&apos;t connected.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-background/80 border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Balance</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {money(data.summary.balance)}
            </p>
          </div>
          <div className="rounded-lg bg-background/80 border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Total in
            </p>
            <p className="text-2xl font-bold text-green-600">{money(data.summary.totalIncome)}</p>
          </div>
          <div className="rounded-lg bg-background/80 border p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Total out
            </p>
            <p className="text-2xl font-bold text-red-500">{money(data.summary.totalExpenses)}</p>
          </div>
        </div>

        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end border rounded-lg p-4 bg-muted/30"
          onSubmit={(e) => {
            e.preventDefault();
            addEntry.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="pb-amount">Amount ($)</Label>
            <Input
              id="pb-amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="49.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pb-desc">Note (optional)</Label>
            <Textarea
              id="pb-desc"
              rows={1}
              placeholder="Pro subscription, consulting, refund…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[38px] resize-none"
            />
          </div>
          <Button type="submit" disabled={addEntry.isPending || !amount}>
            <Plus className="h-4 w-4 mr-1" />
            {addEntry.isPending ? "Adding…" : "Add"}
          </Button>
        </form>

        {addEntry.isError && (
          <p className="text-sm text-red-500">{(addEntry.error as Error).message}</p>
        )}

        <div>
          <p className="text-sm font-medium mb-2">
            Ledger ({data.summary.entryCount} {data.summary.entryCount === 1 ? "entry" : "entries"})
          </p>
          {data.entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No entries yet. Add your first payment above — e.g. a cash sale or pre-Stripe revenue.
            </p>
          ) : (
            <ul className="space-y-2 text-sm max-h-72 overflow-y-auto">
              {data.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex justify-between gap-3 border-b border-border/50 pb-2 items-start"
                >
                  <div className="min-w-0">
                    <p className="truncate">
                      {entry.description || entry.category || entry.type}
                    </p>
                    <p className="text-xs text-muted-foreground flex flex-wrap gap-1.5 items-center">
                      <span>{formatDate(entry.createdAt)}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {entry.source}
                      </Badge>
                    </p>
                  </div>
                  <span
                    className={`font-medium shrink-0 ${
                      entry.amount >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {entry.amount >= 0 ? "+" : ""}
                    {money(entry.amount, entry.currency.toUpperCase())}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
