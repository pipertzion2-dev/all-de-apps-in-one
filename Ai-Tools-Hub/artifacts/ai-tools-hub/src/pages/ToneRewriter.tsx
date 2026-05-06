import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useStream } from "@/hooks/use-stream";
import { Wand2 } from "lucide-react";
import { RewriteToneBodyTone } from "@workspace/api-client-react";

const TONES = Object.values(RewriteToneBodyTone);

export default function ToneRewriterPage() {
  const [text, setText] = useState("");
  const [tone, setTone] = useState<RewriteToneBodyTone>(RewriteToneBodyTone.professional);
  const { streamRequest, data, isLoading } = useStream();

  const handleRewrite = () => {
    if (!text.trim()) return;
    streamRequest("/api/tools/tone-rewrite", { text, tone });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Wand2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Tone Rewriter</h1>
            <p className="text-muted-foreground">Change the attitude of your text instantly.</p>
          </div>
        </div>

        <Card className="border-white/5">
          <div className="p-4 border-b border-white/5 flex flex-wrap gap-2 bg-white/[0.02]">
            {TONES.map(t => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors capitalize ${
                  tone === t 
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' 
                    : 'border-white/10 text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <CardContent className="p-0 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="flex-1 p-6">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Original</label>
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text to rewrite..."
                className="h-[250px] border-0 focus-visible:ring-0 bg-transparent p-0 text-base"
              />
            </div>
            <div className="flex-1 p-6 bg-white/[0.01]">
              <label className="text-sm font-medium text-indigo-400 mb-2 block">Rewritten ({tone})</label>
              <div className="h-[250px] overflow-y-auto text-white whitespace-pre-wrap text-base">
                {data}{isLoading && " ▋"}
                {!data && !isLoading && <span className="text-muted-foreground opacity-50">Result will appear here...</span>}
              </div>
            </div>
          </CardContent>
          <div className="p-4 border-t border-white/5">
            <Button onClick={handleRewrite} isLoading={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 h-12 text-lg">
              Rewrite Magic
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
