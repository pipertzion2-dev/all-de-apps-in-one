import {
  HOMEPAGE_GAME_FACE_SUBLINE,
  HOMEPAGE_GAME_FACE_TITLE,
  HOMEPAGE_PLATFORM_FACE_SUBLINE,
  PRODUCT_HERO_HEADLINE,
  PRODUCT_HOOK_SHORT,
  PRODUCT_MAIN_GOAL,
  PRODUCT_TAGLINE,
} from "@/lib/product-positioning";
import { cn } from "@/lib/utils";

type HomepageMainGoalProps = {
  variant?: "dark" | "light";
  /** compact = tagline + one short line (mobile-first faces) */
  density?: "compact" | "full";
  /** game = Klean Sneaks demo face; platform = guardrails product story */
  surface?: "platform" | "game";
  className?: string;
};

export function HomepageMainGoal({
  variant = "light",
  density = "compact",
  surface = "platform",
  className,
}: HomepageMainGoalProps) {
  const dark = variant === "dark";
  const compactTitle = surface === "game" ? HOMEPAGE_GAME_FACE_TITLE : PRODUCT_HERO_HEADLINE;
  const compactSubline =
    surface === "game"
      ? HOMEPAGE_GAME_FACE_SUBLINE
      : density === "compact"
        ? HOMEPAGE_PLATFORM_FACE_SUBLINE
        : PRODUCT_HOOK_SHORT;

  if (density === "compact") {
    return (
      <div
        className={cn("mx-auto max-w-md space-y-1 text-center", className)}
        data-testid="homepage-main-goal"
      >
        <h2
          className={cn(
            "text-sm font-bold leading-snug tracking-tight sm:text-lg sm:leading-tight",
            dark ? "text-white" : "text-foreground",
          )}
        >
          {compactTitle}
        </h2>
        <p
          className={cn(
            "text-xs leading-snug sm:text-sm",
            dark ? "text-white/65" : "text-muted-foreground",
          )}
        >
          {compactSubline}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("mx-auto max-w-xl space-y-2 text-center", className)}
      data-testid="homepage-main-goal"
    >
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{PRODUCT_HERO_HEADLINE}</h2>
      <p className="text-base font-medium leading-snug text-foreground/90 sm:text-lg">
        {PRODUCT_TAGLINE}
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
        {PRODUCT_MAIN_GOAL}
      </p>
    </div>
  );
}
