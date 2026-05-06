"use client";

import Link from "next/link";
import { trackButtonClick } from "@/lib/analytics";

export function TrackedCta({
  href,
  label,
  className,
  children,
  "data-testid": testId,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
  "data-testid"?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      data-testid={testId}
      onClick={() => trackButtonClick(label, typeof window !== "undefined" ? window.location.pathname : undefined)}
    >
      {children}
    </Link>
  );
}
