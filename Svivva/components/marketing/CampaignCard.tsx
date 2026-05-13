"use client";

const CHANNEL_COLORS: Record<string, string> = {
  email: "bg-blue-100 text-blue-800",
  social: "bg-purple-100 text-purple-800",
  seo: "bg-green-100 text-green-800",
  paid: "bg-orange-100 text-orange-800",
  referral: "bg-pink-100 text-pink-800",
  content: "bg-teal-100 text-teal-800",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
};

interface CampaignCardProps {
  campaign: {
    id: string;
    name: string;
    channel: string;
    status: string;
    budget?: number | null;
    spent?: number | null;
    metrics?: { clicks: number; leads: number; conversions: number } | null;
    startDate?: string | null;
    endDate?: string | null;
  };
  onStatusChange?: (id: string, status: string) => void;
}

export function CampaignCard({ campaign, onStatusChange }: CampaignCardProps) {
  const metrics = campaign.metrics as any;
  const budget = campaign.budget ?? 0;
  const spent = campaign.spent ?? 0;
  const spentPct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-foreground text-sm leading-snug">{campaign.name}</h3>
        <div className="flex gap-1.5 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${CHANNEL_COLORS[campaign.channel] ?? "bg-muted text-muted-foreground"}`}
          >
            {campaign.channel}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[campaign.status] ?? "bg-muted text-muted-foreground"}`}
          >
            {campaign.status}
          </span>
        </div>
      </div>

      {budget > 0 && (
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Budget ${budget.toLocaleString()}</span>
            <span>${spent.toLocaleString()} spent</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all"
              style={{ width: `${spentPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Clicks", value: metrics?.clicks ?? 0 },
          { label: "Leads", value: metrics?.leads ?? 0 },
          { label: "Conversions", value: metrics?.conversions ?? 0 },
        ].map((m) => (
          <div key={m.label} className="bg-muted rounded-lg p-2">
            <div className="text-sm font-bold text-foreground">{m.value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      {onStatusChange && campaign.status !== "completed" && (
        <div className="flex gap-2 pt-1">
          {campaign.status === "draft" && (
            <button
              onClick={() => onStatusChange(campaign.id, "active")}
              className="text-xs px-3 py-1 rounded-md bg-foreground text-background hover:opacity-80 transition-opacity font-medium"
            >
              Activate
            </button>
          )}
          {campaign.status === "active" && (
            <button
              onClick={() => onStatusChange(campaign.id, "paused")}
              className="text-xs px-3 py-1 rounded-md bg-muted text-foreground hover:bg-muted/70 transition-colors font-medium"
            >
              Pause
            </button>
          )}
          {campaign.status === "paused" && (
            <button
              onClick={() => onStatusChange(campaign.id, "active")}
              className="text-xs px-3 py-1 rounded-md bg-foreground text-background hover:opacity-80 transition-opacity font-medium"
            >
              Resume
            </button>
          )}
          <button
            onClick={() => onStatusChange(campaign.id, "completed")}
            className="text-xs px-3 py-1 rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Mark Done
          </button>
        </div>
      )}
    </div>
  );
}
