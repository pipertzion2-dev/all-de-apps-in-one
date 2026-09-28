import { PRODUCT_MAIN_GOAL, PRODUCT_ONE_LINER, PRODUCT_TAGLINE } from "@/lib/product-positioning";
import { cn } from "@/lib/utils";

type HomepageMainGoalProps = {
  /** Dark game panel vs light product panel */
  variant?: "dark" | "light";
  className?: string;
};

/** Shared “what ZZAI is for” block on the two homepage faces (game + main). */
export function HomepageMainGoal({ variant = "light", className }: HomepageMainGoalProps) {
  const dark = variant === "dark";

  return (
    <div
      className={cn("mx-auto max-w-xl space-y-2 text-center", className)}
      data-testid="homepage-main-goal"
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-[0.32em]",
          dark ? "text-[#A8BA48]/90" : "text-[#5B8DA8]",
        )}
      >
        Main goal
      </p>
      <h2
        className={cn(
          "text-xl font-bold tracking-tight sm:text-2xl",
          dark ? "text-white" : "text-foreground",
        )}
      >
        {PRODUCT_TAGLINE}
      </h2>
      <p
        className={cn(
          "text-sm font-medium leading-snug sm:text-base",
          dark ? "text-[#E8D9A8]" : "text-foreground/90",
        )}
      >
        {PRODUCT_MAIN_GOAL}
      </p>
      <p
        className={cn(
          "text-xs leading-relaxed sm:text-sm",
          dark ? "text-white/55" : "text-muted-foreground",
        )}
      >
        {PRODUCT_ONE_LINER}
      </p>
    </div>
  );
}
