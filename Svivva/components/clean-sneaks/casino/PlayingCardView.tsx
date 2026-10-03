"use client";

import { isRedSuit, suitSymbol, type PlayingCard } from "@/lib/clean-sneaks/casino";

type Props = {
  card: PlayingCard;
  faceDown?: boolean;
  selected?: boolean;
  highlight?: boolean;
  dimmed?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  className?: string;
  "data-testid"?: string;
};

const SIZE = {
  sm: "h-14 w-10 text-[10px]",
  md: "h-[4.5rem] w-[3.15rem] text-xs sm:h-20 sm:w-14 sm:text-sm",
  lg: "h-24 w-[4.25rem] text-sm sm:h-28 sm:w-20 sm:text-base",
} as const;

export function PlayingCardView({
  card,
  faceDown = false,
  selected,
  highlight,
  dimmed,
  size = "md",
  onClick,
  className,
  "data-testid": testId,
}: Props) {
  const red = isRedSuit(card.suit);
  const classNames = [
    "relative shrink-0 rounded-md border select-none transition-transform duration-200",
    SIZE[size],
    faceDown
      ? "border-[#A992C1]/50 bg-[linear-gradient(145deg,#4B3B5B,#1a1220_45%,#2a1f33)] shadow-[inset_0_0_0_2px_rgba(169,146,193,0.28)]"
      : "border-[#c8c4a8] bg-[#E5E4C2] shadow-md",
    selected ? "z-10 -translate-y-2 ring-2 ring-[#E5E4C2] scale-105" : "",
    highlight ? "ring-2 ring-[#a8b896] -translate-y-1" : "",
    dimmed ? "opacity-40" : "",
    onClick ? "cursor-pointer hover:-translate-y-1 active:scale-[0.98]" : "",
    className ?? "",
  ].join(" ");

  const inner = faceDown ? (
    <span className="absolute inset-1 rounded border border-[#A992C1]/35 bg-[repeating-linear-gradient(45deg,rgba(138,154,122,0.2)_0_4px,transparent_4px_8px)]" />
  ) : (
    <span
      className={`flex h-full flex-col justify-between p-1 font-semibold leading-none ${
        red ? "text-[#b01030]" : "text-[#1a1a1a]"
      }`}
    >
      <span>
        {card.rank}
        <span className="ml-0.5">{suitSymbol(card.suit)}</span>
      </span>
      <span className="self-end rotate-180">
        {card.rank}
        <span className="ml-0.5">{suitSymbol(card.suit)}</span>
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid={testId ?? `card-${card.id}`}
        className={classNames}
        aria-label={faceDown ? "Face-down card" : `${card.rank} of ${card.suit}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      data-testid={testId ?? `card-${card.id}`}
      className={classNames}
      aria-label={faceDown ? "Face-down card" : `${card.rank} of ${card.suit}`}
    >
      {inner}
    </div>
  );
}
