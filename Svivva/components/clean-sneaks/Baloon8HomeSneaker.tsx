"use client";

import { KAREN_THE_MUSCLE_LOGO_URL } from "@/lib/clean-sneaks/assets";

/** Homepage Clean Sneaks visual — Karen The Muscle logo (not the Baloon8 car). */
export function Baloon8HomeSneaker() {
  return (
    <div
      className="flex min-h-[140px] items-center justify-center bg-white px-3 py-4 sm:min-h-[180px] sm:px-5 sm:py-5"
      data-testid="baloon8-home-sneaker"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={KAREN_THE_MUSCLE_LOGO_URL}
        alt="Karen The Muscle"
        className="mx-auto block h-auto max-h-[120px] w-auto max-w-full object-contain sm:max-h-[156px]"
        draggable={false}
      />
    </div>
  );
}
