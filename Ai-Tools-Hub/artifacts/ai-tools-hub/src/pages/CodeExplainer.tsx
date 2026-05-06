import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useStream } from "@/hooks/use-stream";
import { Markdown } from "@/components/ui/markdown";
import { Code2, Play } from "lucide-react";

export default function CodeExplainerPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  
  const { streamRequest, data, isLoading } = useStream();

  const handleExplain = () => {
    if (!code.trim()) return;
    streamRequest("/api/tools/code-explain", { code, language });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Code Explainer</h1>
            <p className="text-muted-foreground">Paste any code block and get a line-by-line explanation.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="flex flex-col border-white/5 bg-[#1e1e1e]">
            <div className="p-3 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              </div>
              <input 
                placeholder="Language (optional)" 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none w-32"
              />
            </div>
            <CardContent className="p-0">
              <Textarea 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your code here..."
                className="h-[500px] border-0 focus-visible:ring-0 rounded-none bg-transparent resize-none p-6 font-mono text-sm text-blue-300"
                spellCheck={false}
              />
            </CardContent>
            <div className="p-4 border-t border-white/5 bg-black/20">
              <Button onClick={handleExplain} isLoading={isLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white border-0">
                <Play className="w-4 h-4 mr-2" /> Explain Code
              </Button>
            </div>
          </Card>

          <Card className="flex flex-col border-white/5">
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <span className="font-medium">Explanation</span>
            </div>
            <CardContent className="p-6 overflow-y-auto h-[570px]">
              {!data && !isLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">
                  Explanation will appear here
                </div>
              ) : (
                <Markdown content={data + (isLoading ? " ▋" : "")} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
