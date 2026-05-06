import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStream } from "@/hooks/use-stream";
import { Markdown } from "@/components/ui/markdown";
import { AlignLeft, Copy, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SummarizerPage() {
  const [text, setText] = useState("");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [copied, setCopied] = useState(false);
  
  const { streamRequest, data, isLoading } = useStream();

  const handleSummarize = () => {
    if (!text.trim()) return;
    streamRequest("/api/tools/summarize", { text, length });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
            <AlignLeft className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Smart Summarizer</h1>
            <p className="text-muted-foreground">Distill long documents into concise, readable summaries.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Area */}
          <Card className="flex flex-col border-white/5">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <span className="font-medium text-sm">Source Text</span>
              <div className="flex gap-2">
                {(["short", "medium", "long"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLength(l)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      length === l 
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'border-white/10 text-muted-foreground hover:text-white'
                    }`}
                  >
                    {l.charAt(0).toUpperCase() + l.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <CardContent className="p-0 flex-1">
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your long text here..."
                className="h-full min-h-[300px] border-0 focus-visible:ring-0 rounded-none bg-transparent resize-none p-6 text-base"
              />
            </CardContent>
            <div className="p-4 border-t border-white/5">
              <Button onClick={handleSummarize} isLoading={isLoading} className="w-full h-12 text-lg">
                Generate Summary
              </Button>
            </div>
          </Card>

          {/* Output Area */}
          <Card className="flex flex-col border-white/5 relative overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <span className="font-medium text-sm">Summary</span>
              {data && (
                <button onClick={copyToClipboard} className="text-muted-foreground hover:text-white transition-colors">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <CardContent className="p-6 flex-1 overflow-y-auto min-h-[300px]">
              {!data && !isLoading ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <AlignLeft className="w-12 h-12 mb-4" />
                  <p>Summary will appear here</p>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Markdown content={data + (isLoading ? " ▋" : "")} />
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
