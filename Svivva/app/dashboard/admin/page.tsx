"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  DollarSign,
  TrendingUp,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  CreditCard,
} from "lucide-react";

interface AdminOverview {
  platform: { totalUsers: number; totalProjects: number; totalApiCalls: number };
  stripe: {
    lifetimeRevenue: number;
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    trialingSubscriptions: number;
    payingCustomers: number;
    available: boolean;
    recentCharges: {
      id: string;
      amount: number;
      currency: string;
      created: number;
      description: string | null;
    }[];
  };
  marketing: {
    campaigns: number;
    activeCampaigns: number;
    leads: number;
    convertedLeads: number;
    referrals: number;
    referralClicks: number;
    referralSignups: number;
    utmLinks: number;
    utmClicks: number;
    seoPages: number;
    godaddyConnected: boolean;
    googleSearchConsole: boolean;
    indexNowConfigured: boolean;
    status: "operational" | "needs_setup";
  };
  users: {
    id: string;
    email: string | null;
    name: string | null;
    createdAt: string;
    hasStripe: boolean;
    isSubscribed: boolean;
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
  });
}

export default function AdminOverviewPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery<AdminOverview>({
    queryKey: ["/api/admin/overview"],
    queryFn: () => fetch("/api/admin/overview", { credentials: "include" }).then((r) => {
      if (!r.ok) throw new Error("Forbidden or failed to load admin data");
      return r.json();
    }),
  });

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading admin overview…</div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-red-500">Could not load admin overview. Admin access required.</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const marketingOk = data.marketing.status === "operational";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
          <p className="text-sm text-muted-foreground">
            All users, revenue, and marketing system health
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/marketing">
              <Megaphone className="h-4 w-4 mr-2" />
              Marketing
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" /> Total users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{data.platform.totalUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.platform.totalProjects} projects · {data.platform.totalApiCalls} API calls
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Lifetime revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.stripe.available ? money(data.stripe.lifetimeRevenue) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stripe.available
                ? `${data.stripe.payingCustomers} paying customers`
                : "Stripe sync not connected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> MRR / ARR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {data.stripe.available ? money(data.stripe.mrr) : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ARR {data.stripe.available ? money(data.stripe.arr) : "—"} ·{" "}
              {data.stripe.activeSubscriptions} active subs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Megaphone className="h-4 w-4" /> Marketing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {marketingOk ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              <p className="text-lg font-semibold capitalize">{data.marketing.status.replace("_", " ")}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.marketing.seoPages} SEO pages · {data.marketing.leads} leads
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketing system</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Campaigns" value={`${data.marketing.activeCampaigns} active / ${data.marketing.campaigns}`} />
              <Stat label="Leads" value={`${data.marketing.leads} (${data.marketing.convertedLeads} converted)`} />
              <Stat label="Referrals" value={`${data.marketing.referralClicks} clicks · ${data.marketing.referralSignups} signups`} />
              <Stat label="UTM links" value={`${data.marketing.utmLinks} links · ${data.marketing.utmClicks} clicks`} />
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <HealthBadge ok={data.marketing.indexNowConfigured} label="IndexNow" />
              <HealthBadge ok={data.marketing.googleSearchConsole} label="Google Search Console" />
              <HealthBadge ok={data.marketing.godaddyConnected} label="GoDaddy DNS" />
              <HealthBadge ok={data.marketing.seoPages > 0} label="Published SEO pages" />
            </div>
            <Button variant="secondary" size="sm" className="w-full" asChild>
              <Link href="/dashboard/launchpad?autorun=1">
                <ExternalLink className="h-4 w-4 mr-2" />
                Run marketing autopilot
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Recent charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data.stripe.available || data.stripe.recentCharges.length === 0 ? (
              <p className="text-sm text-muted-foreground">No Stripe charge data yet.</p>
            ) : (
              <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
                {data.stripe.recentCharges.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2 border-b border-border/50 pb-2">
                    <span className="truncate text-muted-foreground">
                      {c.description || c.id.slice(0, 12)}
                    </span>
                    <span className="font-medium shrink-0">
                      {money(c.amount, (c.currency || "usd").toUpperCase())}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All users ({data.users.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Joined</th>
                  <th className="p-3 font-medium">Billing</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id} className="border-b border-border/40 hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{u.email ?? "—"}</td>
                    <td className="p-3">{u.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                    <td className="p-3">
                      {u.isSubscribed ? (
                        <Badge variant="default">Subscribed</Badge>
                      ) : u.hasStripe ? (
                        <Badge variant="secondary">Stripe customer</Badge>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function HealthBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <Badge variant={ok ? "default" : "outline"} className={ok ? "bg-green-600" : ""}>
      {ok ? "✓" : "○"} {label}
    </Badge>
  );
}
