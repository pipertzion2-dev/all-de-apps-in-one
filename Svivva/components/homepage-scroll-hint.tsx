"use client";

type HomepageScrollHintProps = {
  label: string;
  direction?: "down" | "up";
  onActivate?: () => void;
  prominent?: boolean;
};

export function HomepageScrollHint({
  label,
  direction = "down",
  onActivate,
  prominent = false,
}: HomepageScrollHintProps) {
  const Tag = onActivate ? "button" : "div";

  return (
    <Tag
      type={onActivate ? "button" : undefined}
      onClick={onActivate}
      className={`absolute left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1.5 ${
        onActivate ? "pointer-events-auto cursor-pointer active:scale-95" : "pointer-events-none"
      } ${direction === "down" ? "bottom-5 sm:bottom-8" : "top-20 sm:top-24"}`}
      aria-label={onActivate ? label : undefined}
    >
      <span
        className={`rounded-full shadow-md ring-1 backdrop-blur-sm ${
          prominent
            ? "bg-[#5B8DA8] px-6 py-2.5 text-sm font-semibold tracking-wide text-white ring-[#5B8DA8]/50"
            : "bg-background/85 px-4 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground ring-border/40"
        }`}
      >
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
        style={
          direction === "down" ? { animation: "scrollBounce 1.5s ease-in-out infinite" } : undefined
        }
        aria-hidden
      >
        <path d="M10 4v12M5 11l5 5 5-5" />
      </svg>
    </Tag>
  );
}
