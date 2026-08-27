"use client";

import { Globe2, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  isWorld: boolean;
  onEnterWorld: () => void;
  onExitWorld: () => void;
  className?: string;
  /** Compact for nav; otherwise a more discoverable CTA. */
  variant?: "nav" | "cta";
};

/** Opt into the playful 3D World desk, or return to the business homepage. */
export function HomepageExperienceToggle({
  isWorld,
  onEnterWorld,
  onExitWorld,
  className = "",
  variant = "nav",
}: Props) {
  if (variant === "cta") {
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={`gap-2 border-[#5B8DA8]/45 ${className}`}
        onClick={isWorld ? onExitWorld : onEnterWorld}
        data-testid="button-enter-world-cta"
      >
        <Globe2 className="w-3.5 h-3.5 text-[#5B8DA8]" />
        {isWorld ? "Back to site" : "Enter World desk"}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={`gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground ${className}`}
      onClick={isWorld ? onExitWorld : onEnterWorld}
      data-testid="button-homepage-experience-toggle"
      title={isWorld ? "Return to the business homepage" : "Optional 3D World mixing board"}
    >
      {isWorld ? (
        <>
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Site</span>
        </>
      ) : (
        <>
          <Globe2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">World</span>
        </>
      )}
    </Button>
  );
}
