"use client";

type HomepageScrollHintProps = {
  label: string;
  direction?: "down" | "up";
  onActivate?: () => void;
  prominent?: boolean;
  /** In document flow (e.g. platform face) instead of absolute overlay. */
  inline?: boolean;
};

export function HomepageScrollHint({
  label,
  direction = "down",
  onActivate,
  prominent = false,
  inline = false,
}: HomepageScrollHintProps) {
  const Tag = onActivate ? "button" : "div";
  const up = direction === "up";

  return (
    <Tag
      type={onActivate ? "button" : undefined}
      onClick={onActivate}
      className={`z-30 flex max-w-[92vw] flex-col items-center gap-1 ${
        up ? "flex-col-reverse" : ""
      } ${
        onActivate ? "pointer-events-auto cursor-pointer active:scale-95" : "pointer-events-none"
      } ${
        inline
          ? "relative mx-auto w-fit py-1"
          : `absolute left-1/2 -translate-x-1/2 ${up ? "top-20 sm:top-24" : "bottom-3 sm:bottom-8"}`
      }`}
      style={
        !inline && !up
          ? { bottom: "max(0.75rem, env(safe-area-inset-bottom))" }
          : undefined
      }
      aria-label={onActivate ? label : undefined}
    >
      <span
        className={`rounded-full shadow-md ring-1 backdrop-blur-sm ${
          prominent
            ? "bg-[#5B8DA8] px-4 py-2 text-xs font-semibold tracking-wide text-white ring-[#5B8DA8]/50 sm:px-6 sm:py-2.5 sm:text-sm"
            : "bg-background/90 px-3 py-1.5 text-[10px] font-medium tracking-wide text-muted-foreground ring-border/40 sm:px-4 sm:text-[11px]"
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
        className={`text-muted-foreground ${up ? "rotate-180" : ""}`}
        style={{ animation: "scrollBounce 1.5s ease-in-out infinite" }}
        aria-hidden
      >
        <path d="M10 4v12M5 11l5 5 5-5" />
      </svg>
    </Tag>
  );
}
