"use client";

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { KLEAN_SNEAKS } from "@/lib/clean-sneaks/brand";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/tools", label: "Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/play", label: "Play" },
  { href: "/clean-sneaks", label: KLEAN_SNEAKS.title },
  { href: "/docs", label: "Docs" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

/** Compact footer for the product-cube homepage. */
export function HomepageSiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/40 bg-background/95">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <p className="text-sm font-bold tracking-[0.22em] text-foreground/90">{BRAND.name}</p>
            <p className="text-sm text-muted-foreground">{BRAND.tagline}</p>
          </div>
          <nav
            aria-label="Footer"
            className="flex max-w-xl flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground"
          >
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-muted-foreground/80">
          © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
