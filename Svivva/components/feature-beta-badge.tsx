import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FeatureBetaBadgeProps = {
  className?: string;
  /** Smaller pill for dense nav */
  compact?: boolean;
};

export function FeatureBetaBadge({ className, compact }: FeatureBetaBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "shrink-0 border border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        compact ? "px-1.5 py-0 text-[9px] uppercase tracking-wide" : "text-[10px] uppercase",
        className,
      )}
    >
      Beta
    </Badge>
  );
}
