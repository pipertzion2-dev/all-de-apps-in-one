import type { Metadata } from "next";
import { headers } from "next/headers";
import { DashboardLayoutClient } from "./dashboard-layout-client";

const DASH = "/dashboard";

function kebabToTitle(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function dashboardTitleFromPath(pathname: string): string {
  const normalized = pathname.replace(/\/+$/, "") || DASH;
  if (normalized === DASH) return "Dashboard";
  const parts = normalized.split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return "Dashboard";
  if (parts.length < 2) return "Dashboard";

  const section = parts[1];
  if (section === "projects") {
    if (parts[2] === "new") return "New project";
    if (parts.length >= 3) return "Project";
    return "Projects";
  }

  return kebabToTitle(section);
}

export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get("x-pathname") || "";
  const title = pathname.startsWith(DASH) ? dashboardTitleFromPath(pathname) : "Dashboard";
  return {
    title,
    description: "Your Svivva workspace — From seed to symphony.",
  };
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
