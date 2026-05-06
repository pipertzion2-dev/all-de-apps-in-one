import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useStream } from "@/hooks/use-stream";
import { Markdown } from "@/components/ui/markdown";
import { CheckCheck } from "lucide-react";

export default function GrammarPage() {
  const [text, setText] = useState("");
  const { streamRequest, data, isLoading } = useStream();

  const handleCheck = () => {
    if (!text.trim()) return;
    streamRequest("/api/tools/grammar", { text });
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Grammar & Style Fixer</h1>
            <p className="text-muted-foreground">Perfect your writing with advanced AI corrections.</p>
          </div>
        </div>

        <Card className="border-white/5">
          <CardContent className="p-0">
            <Textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste text to check..."
              className="min-h-[200px] border-0 focus-visible:ring-0 rounded-t-2xl bg-transparent resize-y p-6 text-lg"
            />
            <div className="p-4 border-t border-white/5 flex justify-end bg-white/[0.02] rounded-b-2xl">
              <Button onClick={handleCheck} isLoading={isLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                Fix Grammar
              </Button>
            </div>
          </CardContent>
        </Card>

        {(data || isLoading) && (
          <Card className="border-emerald-500/30 bg-emerald-500/5 overflow-hidden">
            <div className="p-4 border-b border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-medium">
              Suggestions & Corrections
            </div>
            <CardContent className="p-6">
              <Markdown content={data + (isLoading ? " ▋" : "")} />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
