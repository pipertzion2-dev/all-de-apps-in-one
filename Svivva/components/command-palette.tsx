"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/lib/platform-context";
import { useQuery } from "@tanstack/react-query";
import { useAuth, authFetch } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  Box,
  FlaskConical,
  Lightbulb,
  Sparkles,
  HeartPulse,
  Users,
  Settings,
  Search,
  Rocket,
} from "lucide-react";

interface CommandItem {
  title: string;
  href: string;
  icon: typeof LayoutDashboard;
  keywords: string[];
  section: string;
  adminOnly?: boolean;
}

const digitalCommands: CommandItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "main"],
    section: "Navigate",
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderOpen,
    keywords: ["projects", "apis", "my apps"],
    section: "Navigate",
  },
  {
    title: "API Builder",
    href: "/dashboard/api-builder",
    icon: Package,
    keywords: ["build", "create", "api", "new"],
    section: "Build",
  },
  {
    title: "Hypothesis Lab",
    href: "/dashboard/hypothesis",
    icon: FlaskConical,
    keywords: ["hypothesis", "test", "experiment", "lab"],
    section: "Build",
  },
  {
    title: "Idea Engine",
    href: "/dashboard/idea-engine",
    icon: Lightbulb,
    keywords: ["ideas", "discover", "opportunities", "market"],
    section: "Grow",
  },
  {
    title: "Launch Studio",
    href: "/dashboard/launch-studio",
    icon: Sparkles,
    keywords: ["launch", "marketing", "landing page", "social"],
    section: "Grow",
  },
  {
    title: "Pulse",
    href: "/dashboard/pulse",
    icon: HeartPulse,
    keywords: ["pulse", "analytics", "intelligence", "insights"],
    section: "Grow",
  },
  {
    title: "Collaborate",
    href: "/dashboard/collaborate",
    icon: Users,
    keywords: ["team", "collaborate", "invite", "members"],
    section: "Grow",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    keywords: ["settings", "account", "preferences", "billing"],
    section: "Account",
  },
  {
    title: "Orbit",
    href: "/dashboard/launchpad",
    icon: Rocket,
    keywords: ["orbit", "admin", "marketing", "seo"],
    section: "Account",
    adminOnly: true,
  },
];

const physicalCommands: CommandItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
    keywords: ["dashboard", "home", "main"],
    section: "Navigate",
  },
  {
    title: "Projects",
    href: "/dashboard/projects",
    icon: FolderOpen,
    keywords: ["projects", "products", "my products"],
    section: "Navigate",
  },
  {
    title: "Hardware Builder",
    href: "/dashboard/hardware-builder",
    icon: Box,
    keywords: ["build", "create", "hardware", "product", "new"],
    section: "Build",
  },
  {
    title: "Hypothesis Lab",
    href: "/dashboard/hypothesis-hardware",
    icon: FlaskConical,
    keywords: ["hypothesis", "innovation", "experiment"],
    section: "Build",
  },
  {
    title: "Idea Engine",
    href: "/dashboard/idea-engine",
    icon: Lightbulb,
    keywords: ["ideas", "discover", "opportunities"],
    section: "Grow",
  },
  {
    title: "Collaborate",
    href: "/dashboard/collaborate",
    icon: Users,
    keywords: ["team", "collaborate", "invite"],
    section: "Grow",
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    keywords: ["settings", "account", "preferences"],
    section: "Account",
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { mode } = usePlatform();

  const { isAuthenticated } = useAuth();
  const { data: meData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
    enabled: isAuthenticated,
  });
  const userIsAdmin = meData?.isAdmin ?? false;

  const allCommands = mode === "digital" ? digitalCommands : physicalCommands;
  const commands = allCommands.filter((c) => !c.adminOnly || userIsAdmin);

  const filtered = query.trim()
    ? commands.filter((c) => {
        const q = query.toLowerCase();
        return c.title.toLowerCase().includes(q) || c.keywords.some((k) => k.includes(q));
      })
    : commands;

  const sections = [...new Set(filtered.map((c) => c.section))];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].href);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" data-testid="command-palette">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute top-[12%] sm:top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg">
        <div className="bg-card border border-border/50 rounded-xl shadow-2xl overflow-hidden mx-3 sm:mx-4">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or jump to..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              data-testid="input-command-search"
            />
            <kbd className="text-[10px] text-muted-foreground/40 bg-muted/30 px-1.5 py-0.5 rounded border border-border/20">
              ESC
            </kbd>
          </div>
          <div className="max-h-[300px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                No results found
              </div>
            ) : (
              sections.map((section) => (
                <div key={section}>
                  <p className="px-4 pt-2 pb-1 text-[10px] text-muted-foreground/40 uppercase tracking-widest font-medium">
                    {section}
                  </p>
                  {filtered
                    .filter((c) => c.section === section)
                    .map((cmd) => {
                      const globalIdx = filtered.indexOf(cmd);
                      return (
                        <button
                          key={cmd.href}
                          onClick={() => navigate(cmd.href)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                          className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2 text-left text-sm transition-colors ${
                            globalIdx === selectedIndex
                              ? "bg-[#5BA8A0]/10 text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          data-testid={`cmd-${cmd.title.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          <cmd.icon className="w-4 h-4 shrink-0" />
                          <span>{cmd.title}</span>
                        </button>
                      );
                    })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger() {
  return (
    <button
      onClick={() =>
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
      }
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border/30 bg-muted/20 hover:bg-muted/40 transition-colors text-muted-foreground text-xs"
      data-testid="button-search-trigger"
    >
      <Search className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="text-[10px] text-muted-foreground/40 bg-muted/20 px-1 py-0.5 rounded border border-border/20 hidden sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
