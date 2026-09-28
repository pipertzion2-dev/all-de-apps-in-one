import { PRODUCT_HOOK_SHORT, PRODUCT_MAIN_GOAL, PRODUCT_TAGLINE } from "@/lib/product-positioning";
import { cn } from "@/lib/utils";

type HomepageMainGoalProps = {
  variant?: "dark" | "light";
  /** compact = tagline + one short line (mobile-first faces) */
  density?: "compact" | "full";
  className?: string;
};

export function HomepageMainGoal({
  variant = "light",
  density = "compact",
  className,
}: HomepageMainGoalProps) {
  const dark = variant === "dark";

  if (density === "compact") {
    return (
      <div
        className={cn("mx-auto max-w-md space-y-1 text-center", className)}
        data-testid="homepage-main-goal"
      >
        <h2
          className={cn(
            "text-base font-bold leading-tight tracking-tight sm:text-xl",
            dark ? "text-white" : "text-foreground",
          )}
        >
          {PRODUCT_TAGLINE}
        </h2>
        <p
          className={cn(
            "text-xs leading-snug sm:text-sm",
            dark ? "text-white/65" : "text-muted-foreground",
          )}
        >
          {PRODUCT_HOOK_SHORT}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("mx-auto max-w-xl space-y-2 text-center", className)}
      data-testid="homepage-main-goal"
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{PRODUCT_TAGLINE}</h2>
      <p className="text-base font-medium leading-snug text-foreground/90 sm:text-lg">
        {PRODUCT_MAIN_GOAL}
      </p>
    </div>
  );
}
