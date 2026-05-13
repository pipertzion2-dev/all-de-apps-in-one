interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

export function StatsCard({ label, value, sub, trend, trendValue }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold text-foreground">{value}</span>
      {(sub || trendValue) && (
        <span
          className={`text-xs ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}
        >
          {trendValue && (
            <>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : ""} {trendValue}{" "}
            </>
          )}
          {sub}
        </span>
      )}
    </div>
  );
}
