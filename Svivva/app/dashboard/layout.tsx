"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth, authFetch } from "@/hooks/use-auth";
import { usePlan } from "@/hooks/use-plan";
import { useQuery } from "@tanstack/react-query";
import { Sidebar, SidebarContent, SidebarProvider, SidebarTrigger, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePlatform } from "@/lib/platform-context";
import { trackSignup } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import svivvaLogo from "@/attached_assets/SVIVVA_OFFICIAL_LOGO_1769201341308.png";
import softwareFlowerLogo from "@/attached_assets/Svivva_print_2_1769474625495.png";
import hardwareFlowerLogo from "@/attached_assets/Svivva_official_3_1769474625495.png";
import seedsLogo from "@/attached_assets/Svivva_Seeds_6_1771888740460.png";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Settings,
  LogOut,
  Plus,
  LogIn,
  AlertCircle,
  Package,
  Box,
  Lightbulb,
  Rocket,
  Sparkles,
  FlaskConical,
  BarChart2,
  Lock,
  Search,
  TrendingUp,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { TutorialProvider } from "@/components/tutorial-system";
import { CommandPalette, SearchTrigger } from "@/components/command-palette";

type MenuItem = { title: string; desc?: string; href: string; icon: typeof LayoutDashboard; highlight?: boolean; adminOnly?: boolean; proOnly?: boolean };
type MenuGroup = { label: string; items: MenuItem[] };

const digitalMenuGroups: MenuGroup[] = [
  {
    label: "",
    items: [
      { title: "Home", desc: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Projects", desc: "Your APIs", href: "/dashboard/projects", icon: FolderOpen },
    ],
  },
  {
    label: "Build",
    items: [
      { title: "API Builder", desc: "Create an API", href: "/dashboard/api-builder", icon: Package, proOnly: true },
      { title: "Hypothesis Lab", desc: "Test relationships", href: "/dashboard/hypothesis", icon: FlaskConical, proOnly: true },
    ],
  },
  {
    label: "Grow",
    items: [
      { title: "Idea Engine", desc: "Opportunities", href: "/dashboard/idea-engine", icon: Lightbulb, proOnly: true },
      { title: "Launch Studio", desc: "Marketing", href: "/dashboard/launch-studio", icon: Sparkles, proOnly: true },
      { title: "Growth Engine", desc: "Auto-marketing", href: "/dashboard/growth", icon: TrendingUp, adminOnly: true },
    ],
  },
  {
    label: "",
    items: [
      { title: "Settings", desc: "Account", href: "/dashboard/settings", icon: Settings },
      { title: "Traffic", desc: "Analytics", href: "/dashboard/traffic", icon: BarChart2, adminOnly: true },
      { title: "Google Search", desc: "GSC connection", href: "/dashboard/gsc-connect", icon: Search, adminOnly: true },
      { title: "Orbit", desc: "Admin", href: "/dashboard/launchpad", icon: Rocket, adminOnly: true },
    ],
  },
];

const physicalMenuGroups: MenuGroup[] = [
  {
    label: "",
    items: [
      { title: "Home", desc: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Projects", desc: "Your products", href: "/dashboard/projects", icon: FolderOpen },
    ],
  },
  {
    label: "Build",
    items: [
      { title: "Hardware Builder", desc: "Design a product", href: "/dashboard/hardware-builder", icon: Box },
      { title: "Hypothesis Lab", desc: "Innovation engine", href: "/dashboard/hypothesis-hardware", icon: FlaskConical },
    ],
  },
  {
    label: "Grow",
    items: [
      { title: "Idea Engine", desc: "Opportunities", href: "/dashboard/idea-engine", icon: Lightbulb },
    ],
  },
  {
    label: "",
    items: [
      { title: "Settings", desc: "Account", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const { mode, toggleMode } = usePlatform();
  const pathname = usePathname();
  const [authError, setAuthError] = useState<string | null>(null);

  const { data: meData } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/auth/me"],
    queryFn: () => authFetch("/api/auth/me").then((r) => r.json()),
    enabled: isAuthenticated,
  });
  const userIsAdmin = meData?.isAdmin ?? false;
  const { isPro } = usePlan();

  const baseMenuGroups = mode === "digital" ? digitalMenuGroups : physicalMenuGroups;
  const menuGroups = useMemo(() =>
    baseMenuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.adminOnly || userIsAdmin),
      }))
      .filter((group) => group.items.length > 0),
    [baseMenuGroups, userIsAdmin]
  );
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("auth_error");
      if (error) {
        setAuthError(error);
        window.history.replaceState({}, "", window.location.pathname);
      }
      const sessionToken = params.get("session_token");
      if (sessionToken) {
        trackSignup("replit_oidc");
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Capture current path so after login we return here (e.g. /dashboard/launchpad)
    const returnTo = typeof window !== "undefined" ? window.location.pathname : "/dashboard";
    const loginHref = `/api/auth/login?redirect=${encodeURIComponent(returnTo)}`;

    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-4">
              <Image 
                src={svivvaLogo} 
                alt="Svivva" 
                width={120} 
                height={40} 
                className="h-10 w-auto object-contain"
              />
            </div>
            <CardTitle className="text-2xl">Welcome to Svivva</CardTitle>
            <CardDescription>
              {authError ? (
                <span className="text-amber-500 flex items-center justify-center gap-2 mt-2">
                  <AlertCircle className="w-4 h-4" />
                  Login interrupted. Please try again.
                </span>
              ) : (
                "Sign in to access your dashboard"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              For the best experience, please open this app in a new browser tab using the button in the top-right corner of the preview.
            </p>
            <a href={loginHref} className="block">
              <Button className="w-full gap-2" data-testid="button-login">
                <LogIn className="w-4 h-4" />
                Sign In with Replit
              </Button>
            </a>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full" data-testid="button-back-home">
                Back to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMode}
                className="relative w-16 h-8 rounded-full bg-card border border-border shadow-sm cursor-pointer overflow-hidden"
                title={`Switch to ${mode === "digital" ? "Physical" : "Digital"} mode`}
                data-testid="button-platform-toggle"
              >
                <div 
                  className={`absolute top-0.5 bottom-0.5 w-7 rounded-full bg-primary shadow-md transition-[left] duration-300 ease-drawer ${mode === "physical" ? "left-[calc(100%-1.875rem)]" : "left-0.5"}`}
                />
                <div className="absolute inset-0 flex items-center px-1">
                  <div className={`relative w-6 h-6 rounded-full overflow-hidden z-10 transition-transform duration-300 ${mode === "digital" ? "scale-100" : "scale-75 opacity-50"}`}>
                    <Image 
                      src={hardwareFlowerLogo} 
                      alt="Digital" 
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </div>
                  <div className={`relative w-6 h-6 rounded-full overflow-hidden z-10 ml-auto transition-transform duration-300 ${mode === "physical" ? "scale-100" : "scale-75 opacity-50"}`}>
                    <Image 
                      src={softwareFlowerLogo} 
                      alt="Physical" 
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </button>
              <Link href="/">
                <Image 
                  src={svivvaLogo} 
                  alt="Svivva" 
                  width={100} 
                  height={32} 
                  className="h-8 w-auto object-contain"
                />
              </Link>
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            {menuGroups.map((group, gi) => (
              <SidebarGroup key={group.label || `g${gi}`}>
                {group.label && <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">{group.label}</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => {
                      const locked = item.proOnly && !isPro && !userIsAdmin;
                      const href = locked ? "/dashboard/billing" : item.href;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <Link
                              href={href}
                              data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                              title={locked ? `${item.desc} — Pro feature` : item.desc}
                              className={locked ? "opacity-60" : ""}
                            >
                              <item.icon className="w-4 h-4" />
                              <span className="text-sm flex-1">{item.title}</span>
                              {locked && <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}

            <SidebarGroup>
              <SidebarGroupContent>
                {mode === "digital" ? (
                  <Link href="/dashboard/api-builder" key="digital-cta">
                    <Button className="w-full gap-2" data-testid="button-new-project">
                      <Plus className="w-4 h-4" />
                      New API
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard/hardware-builder" key="physical-cta">
                    <Button className="w-full gap-2" data-testid="button-new-project">
                      <Plus className="w-4 h-4" />
                      New Product
                    </Button>
                  </Link>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback>
                  {user?.firstName?.[0] || user?.email?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.firstName || user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full gap-2"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 h-14 px-4 border-b border-white/10 backdrop-blur-xl bg-background/80">
            <SidebarTrigger data-testid="button-sidebar-toggle" />

            <SearchTrigger />

            <div className="flex items-center gap-2">
              <Link href="/seeds" className="group flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted/30 transition-all" data-testid="link-dashboard-seeds">
                <div className="relative w-6 h-6 rounded-md overflow-hidden group-hover:scale-110 transition-transform">
                  <Image src={seedsLogo} alt="Svivva Seeds" fill sizes="24px" className="object-cover" />
                </div>
                <span className="seeds-holo-text text-xs font-bold tracking-wide hidden sm:inline">Seeds</span>
              </Link>
              <Link href="/play" className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors" data-testid="link-dashboard-play">
                <span className="seeds-holo-text text-base leading-none">&#9835;</span>
                <span className="seeds-holo-text text-xs font-bold tracking-wide hidden sm:inline">Play</span>
              </Link>
              <ThemeToggle />
            </div>
          </header>
          <CommandPalette />
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            {children}
            <TutorialProvider pathname={pathname} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
