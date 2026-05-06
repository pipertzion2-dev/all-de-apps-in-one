import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Key, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useExtractKeywords } from "@workspace/api-client-react";

export default function KeywordsPage() {
  const [text, setText] = useState("");
  const { mutateAsync, data, isPending } = useExtractKeywords();

  const handleExtract = async () => {
    if (!text.trim()) return;
    await mutateAsync({ data: { text, count: 10 } });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Keyword Extractor</h1>
            <p className="text-muted-foreground">Pull out the most important concepts and terms from text.</p>
          </div>
        </div>

        <Card className="border-white/5">
          <CardContent className="p-6">
            <Textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste article, document, or essay..."
              className="min-h-[200px] mb-4 text-base"
            />
            <Button onClick={handleExtract} disabled={isPending} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white border-0">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Extract Keywords
            </Button>
          </CardContent>
        </Card>

        {data && (
          <Card className="border-white/5">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold text-white">Extracted Topics</h3>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-3">
                {data.keywords.map((kw, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ delay: i * 0.05 }}
                    key={kw.word}
                    className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2"
                  >
                    <span className="font-semibold text-white">{kw.word}</span>
                    <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                      {Math.round(kw.relevance * 100)}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
