"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart2,
  ExternalLink,
  Users,
  Globe,
  TrendingUp,
  Activity,
  MousePointerClick,
  Search,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-QL8EXZZMS6";
const GA_BASE = "https://analytics.google.com/analytics/web/";

const GA_LINKS = [
  {
    label: "Real-time",
    desc: "Who's on your site right now",
    icon: Activity,
    url: `${GA_BASE}#/realtime/overview`,
    color: "text-green-500",
  },
  {
    label: "Overview",
    desc: "Sessions, users, bounce rate",
    icon: BarChart2,
    url: GA_BASE,
    color: "text-teal-500",
  },
  {
    label: "Acquisition",
    desc: "Where your traffic comes from",
    icon: TrendingUp,
    url: `${GA_BASE}#/acquisition/overview`,
    color: "text-blue-500",
  },
  {
    label: "Pages",
    desc: "Most visited pages",
    icon: Globe,
    url: `${GA_BASE}#/content/pages`,
    color: "text-purple-500",
  },
  {
    label: "Audience",
    desc: "Who your visitors are",
    icon: Users,
    url: `${GA_BASE}#/audience/overview`,
    color: "text-orange-500",
  },
  {
    label: "Search Console",
    desc: "Google search clicks & impressions",
    icon: Search,
    url: "https://search.google.com/search-console",
    color: "text-yellow-500",
  },
];

interface NativeStats {
  totalUsers: number;
  totalProjects: number;
  totalApiCalls: number;
  totalSeoPages: number;
}

export default function TrafficPage() {
  const { data: stats } = useQuery<NativeStats>({
    queryKey: ["/api/admin/traffic-stats"],
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Traffic & Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Live data from svivva.com
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-green-600 border-green-600/30 bg-green-500/10">
            <CheckCircle2 className="h-3 w-3" />
            GA Connected · {GA_ID}
          </Badge>
          <Button
            size="sm"
            onClick={() => window.open(GA_BASE, "_blank")}
            data-testid="button-open-ga"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
            Open Google Analytics
          </Button>
        </div>
      </div>

      {/* Native stats from DB */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Registered Users", value: stats?.totalUsers ?? "—", icon: Users, color: "text-teal-500" },
          { label: "Live Projects", value: stats?.totalProjects ?? "—", icon: Activity, color: "text-blue-500" },
          { label: "API Calls (total)", value: stats?.totalApiCalls != null ? stats.totalApiCalls.toLocaleString() : "—", icon: MousePointerClick, color: "text-purple-500" },
          { label: "SEO Pages Live", value: stats?.totalSeoPages ?? "—", icon: Globe, color: "text-orange-500" },
        ].map((s) => (
          <Card key={s.label} data-testid={`card-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* GA quick links */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          Quick Links
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {GA_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => window.open(link.url, "_blank")}
              data-testid={`button-ga-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
              className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left group"
            >
              <link.icon className={`h-5 w-5 mt-0.5 ${link.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm flex items-center gap-1">
                  {link.label}
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
                <div className="text-xs text-muted-foreground truncate">{link.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* GA open card */}
      <Card className="overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-teal-500 via-teal-400 to-transparent" />
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
            <BarChart2 className="h-7 w-7 text-teal-500" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-bold text-base">Open Google Analytics Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Property <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{GA_ID}</span> is connected and tracking visitors on svivva.com. Click to view your live charts.
            </p>
          </div>
          <Button
            className="shrink-0 gap-2"
            style={{ background: "#5BA8A0" }}
            onClick={() => window.open(GA_BASE, "_blank")}
            data-testid="button-open-ga-main"
          >
            <ExternalLink className="h-4 w-4" />
            Open Analytics
          </Button>
        </CardContent>
      </Card>

      {/* What to check */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
          What to check
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { title: "Are people visiting?", desc: "Reports → Realtime — shows who's on the site right now.", icon: Activity, color: "text-green-500" },
            { title: "Where does traffic come from?", desc: "Reports → Acquisition → Traffic acquisition.", icon: TrendingUp, color: "text-blue-500" },
            { title: "Which pages are popular?", desc: "Reports → Engagement → Pages and screens.", icon: Globe, color: "text-purple-500" },
            { title: "How many users total?", desc: "Reports → Overview — sessions, users, bounce rate.", icon: Users, color: "text-orange-500" },
          ].map((tip) => (
            <button
              key={tip.title}
              onClick={() => window.open(GA_BASE, "_blank")}
              data-testid={`button-tip-${tip.title.toLowerCase().replace(/\s+/g, "-").replace(/\?/g, "")}`}
              className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-accent transition-colors text-left group"
            >
              <tip.icon className={`h-5 w-5 mt-0.5 shrink-0 ${tip.color}`} />
              <div>
                <p className="font-medium text-sm flex items-center gap-1">
                  {tip.title}
                  <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
