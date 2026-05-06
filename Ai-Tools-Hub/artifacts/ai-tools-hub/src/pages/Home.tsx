import React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Sparkles, MessageSquare, AlignLeft, Languages, Code2, CheckCheck, Smile, Key, Wand2, Image as ImageIcon, Lightbulb, Search, Cpu, Wrench, Package, Music, FlaskConical } from "lucide-react";
import { ALL_TOOLS, CATEGORIES, getToolsByCategory, Category, Tool } from "@/data/tools";

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  'AI Prompt Tools': Search,
  'Developer Tools': Wrench,
  'AI Model Tools': Cpu,
  'Hardware & BOM': Package,
  'Content & Writing': AlignLeft,
  'Code Tools': Code2,
  'Language Tools': Languages,
  'Data Tools': Key,
  'Music & Audio': Music,
  'Research & Analysis': FlaskConical,
};

const CATEGORY_COLORS: Record<Category, string> = {
  'AI Prompt Tools': 'text-violet-400',
  'Developer Tools': 'text-orange-400',
  'AI Model Tools': 'text-cyan-400',
  'Hardware & BOM': 'text-amber-400',
  'Content & Writing': 'text-purple-400',
  'Code Tools': 'text-green-400',
  'Language Tools': 'text-blue-400',
  'Data Tools': 'text-pink-400',
  'Music & Audio': 'text-rose-400',
  'Research & Analysis': 'text-teal-400',
};

const BUILT_IN_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  'ai-chat': { icon: MessageSquare, color: 'text-blue-400' },
  'text-summarizer': { icon: AlignLeft, color: 'text-purple-400' },
  'ai-translator': { icon: Languages, color: 'text-green-400' },
  'code-explainer': { icon: Code2, color: 'text-orange-400' },
  'grammar-checker': { icon: CheckCheck, color: 'text-emerald-400' },
  'sentiment-analyzer': { icon: Smile, color: 'text-pink-400' },
  'keyword-extractor': { icon: Key, color: 'text-yellow-400' },
  'tone-rewriter': { icon: Wand2, color: 'text-indigo-400' },
  'image-generator': { icon: ImageIcon, color: 'text-cyan-400' },
  'quiz-generator': { icon: Lightbulb, color: 'text-rose-400' },
};

const BUILT_IN_PATHS: Record<string, string> = {
  'ai-chat': '/chat',
  'text-summarizer': '/summarize',
  'ai-translator': '/translate',
  'code-explainer': '/code-explain',
  'grammar-checker': '/grammar',
  'sentiment-analyzer': '/sentiment',
  'keyword-extractor': '/keywords',
  'tone-rewriter': '/tone-rewrite',
  'image-generator': '/image-gen',
  'quiz-generator': '/quiz',
};

function ToolCard({ tool }: { tool: Tool }) {
  const path = tool.isBuiltIn ? (BUILT_IN_PATHS[tool.slug] || `/${tool.slug}`) : `/${tool.slug}`;
  const builtIn = BUILT_IN_ICONS[tool.slug];
  const CatIcon = CATEGORY_ICONS[tool.category];
  const Icon = builtIn?.icon || CatIcon;
  const color = builtIn?.color || CATEGORY_COLORS[tool.category];

  return (
    <Link href={path} className="block group h-full">
      <Card className="h-full border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 group-hover:border-primary/30">
        <CardContent className="p-6 flex flex-col h-full">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{tool.name}</h3>
          <p className="text-xs text-muted-foreground flex-1 line-clamp-2">{tool.tagline}</p>
          <div className="mt-4 flex items-center text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Try free <ArrowRight className="w-3 h-3 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const activeCategories = CATEGORIES.filter(cat => getToolsByCategory(cat).length > 0);

  return (
    <Layout>
      <div className="space-y-14">
        <section className="relative rounded-3xl overflow-hidden glass-panel">
          <div className="absolute inset-0 z-0">
            <img
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt="Hero Background"
              className="w-full h-full object-cover opacity-60 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
          </div>
          <div className="relative z-10 px-8 py-16 md:py-24 max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>{ALL_TOOLS.length} free AI tools — powered by svivva</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-display font-bold text-white leading-tight mb-6">
                svivva-tools.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">84+ AI mini apps.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                Free AI-powered tools for writing, coding, translating, prompt engineering, hardware BOM generation, and more — all in one place.
              </p>
              <a
                href="https://svivva.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/80 transition-colors"
              >
                Explore the full Svivva suite <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>
        </section>

        {activeCategories.map(category => {
          const tools = getToolsByCategory(category);
          const CatIcon = CATEGORY_ICONS[category];
          const catColor = CATEGORY_COLORS[category];
          return (
            <section key={category}>
              <div className="flex items-center gap-3 mb-6">
                <CatIcon className={`w-5 h-5 ${catColor}`} />
                <h2 className="text-xl font-display font-bold text-white">{category}</h2>
                <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{tools.length} tools</span>
              </div>
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {tools.map(tool => (
                  <motion.div key={tool.slug} variants={item}>
                    <ToolCard tool={tool} />
                  </motion.div>
                ))}
              </motion.div>
            </section>
          );
        })}

        <section className="rounded-3xl border border-primary/20 bg-primary/5 p-8 md:p-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-display font-bold text-white mb-3">Upgrade to the full Svivva suite</h2>
            <p className="text-muted-foreground mb-6">These mini tools are a preview. The full platform gives you AI pipelines, production exports, team collaboration, and everything connected in one place.</p>
            <div className="flex flex-wrap gap-3">
              <a href="https://svivva.com/signup" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/80 transition-colors">
                Create Free Account →
              </a>
              <a href="https://svivva.com" target="_blank" rel="noopener noreferrer" className="px-6 py-3 rounded-xl border border-white/10 text-white font-semibold hover:bg-white/5 transition-colors">
                Learn about Svivva
              </a>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
