"use client";

type HomepageScrollHintProps = {
  label: string;
  direction?: "down" | "up";
};

export function HomepageScrollHint({ label, direction = "down" }: HomepageScrollHintProps) {
  return (
    <div
      className={`pointer-events-none absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 ${
        direction === "down" ? "bottom-6 sm:bottom-8" : "top-20 sm:top-24"
      }`}
      aria-hidden
    >
      <span className="rounded-full bg-background/75 px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground shadow-sm ring-1 ring-border/40 backdrop-blur-sm">
        {label}
      </span>
      <svg
        width="18"
        height="18"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`text-muted-foreground ${direction === "up" ? "rotate-180" : ""}`}
        style={direction === "down" ? { animation: "scrollBounce 1.5s ease-in-out infinite" } : undefined}
      >
        <path d="M10 4v12M5 11l5 5 5-5" />
      </svg>
    </div>
  );
}
