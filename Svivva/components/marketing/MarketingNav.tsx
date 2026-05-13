"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/marketing-hub", label: "Dashboard" },
  { href: "/marketing-hub/campaigns", label: "Campaigns" },
  { href: "/marketing-hub/leads", label: "Leads" },
  { href: "/marketing-hub/referrals", label: "Referrals" },
  { href: "/marketing-hub/utm", label: "UTM Builder" },
  { href: "/marketing-hub/amplify", label: "Amplify" },
  { href: "/marketing-hub/ab-tests", label: "A/B Tests" },
];

export function MarketingNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 flex-wrap border-b border-border pb-4 mb-6">
      {navItems.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/marketing-hub" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
