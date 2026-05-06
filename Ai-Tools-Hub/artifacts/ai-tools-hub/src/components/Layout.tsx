import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  MessageSquare, AlignLeft, Languages, Code2, CheckCheck,
  Smile, Key, Wand2, Image as ImageIcon, Lightbulb,
  Search, Cpu, Wrench, Package, ChevronDown, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, getToolsByCategory, Category } from "@/data/tools";

const BUILT_IN_NAV = [
  { id: "chat", name: "AI Chat", path: "/chat", icon: MessageSquare, color: "text-blue-400" },
  { id: "summarize", name: "Summarizer", path: "/summarize", icon: AlignLeft, color: "text-purple-400" },
  { id: "translate", name: "Translator", path: "/translate", icon: Languages, color: "text-green-400" },
  { id: "code", name: "Code Explainer", path: "/code-explain", icon: Code2, color: "text-orange-400" },
  { id: "grammar", name: "Grammar Check", path: "/grammar", icon: CheckCheck, color: "text-emerald-400" },
  { id: "sentiment", name: "Sentiment", path: "/sentiment", icon: Smile, color: "text-pink-400" },
  { id: "keywords", name: "Keywords", path: "/keywords", icon: Key, color: "text-yellow-400" },
  { id: "tone", name: "Tone Rewriter", path: "/tone-rewrite", icon: Wand2, color: "text-indigo-400" },
  { id: "image", name: "Image Gen", path: "/image-gen", icon: ImageIcon, color: "text-cyan-400" },
  { id: "quiz", name: "Quiz Maker", path: "/quiz", icon: Lightbulb, color: "text-rose-400" },
];

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  'AI Prompt Tools': Search,
  'Developer Tools': Wrench,
  'AI Model Tools': Cpu,
  'Hardware & BOM': Package,
  'Content & Writing': AlignLeft,
  'Code Tools': Code2,
  'Language Tools': Languages,
  'Data Tools': Key,
};

const UPLOADED_CATEGORIES: Category[] = [
  'AI Prompt Tools',
  'Developer Tools',
  'AI Model Tools',
  'Hardware & BOM',
];

function CategorySection({ category, location }: { category: Category; location: string }) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICONS[category];
  const tools = getToolsByCategory(category).filter(t => !t.isBuiltIn);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-muted-foreground hover:bg-white/5 hover:text-white transition-all duration-200"
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium text-sm flex-1 text-left">{category}</span>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-0.5">
          {tools.map(tool => {
            const isActive = location === `/${tool.slug}`;
            return (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-5 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span>{tool.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <aside className="w-full md:w-72 border-r border-white/5 bg-card/30 backdrop-blur-xl flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 z-50">
        <div className="p-6 flex items-center gap-3">
          <div>
            <Link href="/" className="font-display font-bold text-xl tracking-tight text-white hover:text-primary transition-colors cursor-pointer">
              svivva-tools
            </Link>
            <p className="text-xs text-muted-foreground">by svivva</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-4 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-hidden hide-scrollbar">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 ml-2 hidden md:block">
            Built-in AI Tools
          </div>
          {BUILT_IN_NAV.map((tool) => {
            const isActive = location === tool.path;
            const Icon = tool.icon;
            return (
              <Link
                key={tool.id}
                href={tool.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 whitespace-nowrap md:whitespace-normal group relative",
                  isActive
                    ? "bg-primary/10 text-white"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-primary" : tool.color)} />
                <span className="font-medium text-sm">{tool.name}</span>
              </Link>
            );
          })}

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2 ml-2 hidden md:block">
            Mini App Tools
          </div>
          <div className="hidden md:block">
            {UPLOADED_CATEGORIES.map(cat => (
              <CategorySection key={cat} category={cat} location={location} />
            ))}
          </div>

          <div className="hidden md:block mt-4 px-4">
            <a
              href="https://svivva.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-xs py-2 px-3 rounded-lg bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-colors"
            >
              ↗ Full Svivva Suite
            </a>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 max-h-screen overflow-y-auto">
        <div className="flex-1 p-4 md:p-8 lg:p-10 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}

export { BUILT_IN_NAV as TOOLS };
