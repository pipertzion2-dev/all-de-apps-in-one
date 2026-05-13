import type { Metadata } from "next";
import Link from "next/link";
import { StatsCard } from "@/components/marketing/StatsCard";
import { getCampaignSummary } from "@/lib/marketing/campaigns";
import { getLeadStats } from "@/lib/marketing/leads";
import { getReferralStats } from "@/lib/marketing/referrals";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/marketing/campaigns", label: "New Campaign", description: "Launch a multi-channel campaign" },
  { href: "/marketing/leads", label: "Capture Lead", description: "Add or import leads manually" },
  { href: "/marketing/referrals", label: "Create Referral Link", description: "Generate a tracked referral link" },
  { href: "/marketing/utm", label: "Build UTM URL", description: "Create a trackable campaign URL" },
  { href: "/marketing/amplify", label: "Amplify Content", description: "Repurpose content across channels" },
  { href: "/marketing/ab-tests", label: "Start A/B Test", description: "Test variants and find what converts" },
];

export default async function MarketingDashboard() {
  const [campaignSummary, leadStats, referralStats] = await Promise.all([
    getCampaignSummary().catch(() => null),
    getLeadStats().catch(() => null),
    getReferralStats().catch(() => null),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard label="Active Campaigns" value={campaignSummary?.active ?? 0} sub={`of ${campaignSummary?.total ?? 0} total`} />
          <StatsCard label="Total Leads" value={leadStats?.total ?? 0} sub={`${leadStats?.new ?? 0} new`} trend="up" trendValue={`${leadStats?.converted ?? 0} converted`} />
          <StatsCard label="Referral Clicks" value={referralStats?.totalClicks ?? 0} sub={`${referralStats?.totalSignups ?? 0} signups`} />
          <StatsCard label="Avg Lead Score" value={`${leadStats?.avgScore ?? 0}/100`} sub="scoring active" />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Campaign Channels</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {Object.entries(campaignSummary?.byChannel ?? {}).map(([channel, count]) => (
            <div key={channel} className="rounded-lg border border-border bg-card p-3 text-center">
              <div className="text-lg font-bold text-foreground">{count as number}</div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">{channel}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Lead Pipeline</h2>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "New", value: leadStats?.new ?? 0, color: "bg-blue-500" },
            { label: "Contacted", value: (leadStats?.total ?? 0) - (leadStats?.new ?? 0) - (leadStats?.qualified ?? 0) - (leadStats?.converted ?? 0), color: "bg-yellow-500" },
            { label: "Qualified", value: leadStats?.qualified ?? 0, color: "bg-orange-500" },
            { label: "Converted", value: leadStats?.converted ?? 0, color: "bg-green-500" },
          ].map((stage) => (
            <div key={stage.label} className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-3 flex-1 min-w-[120px]">
              <div className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
              <div>
                <div className="text-lg font-bold text-foreground">{stage.value}</div>
                <div className="text-xs text-muted-foreground">{stage.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href} className="rounded-xl border border-border bg-card hover:bg-muted transition-colors p-4 block group">
              <div className="font-medium text-foreground group-hover:text-foreground text-sm">{action.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{action.description}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Referral Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard label="Total Referrals" value={referralStats?.total ?? 0} />
          <StatsCard label="Total Clicks" value={referralStats?.totalClicks ?? 0} />
          <StatsCard label="Signups" value={referralStats?.totalSignups ?? 0} />
          <StatsCard label="Conversion Rate" value={`${referralStats?.conversionRate ?? 0}%`} trend="up" />
        </div>
      </section>
    </div>
  );
}
