import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useStream } from "@/hooks/use-stream";
import { Languages, ArrowRightLeft } from "lucide-react";

const LANGUAGES = [
  "Spanish", "French", "German", "Italian", "Portuguese", 
  "Japanese", "Korean", "Chinese", "Russian", "Arabic"
];

export default function TranslatorPage() {
  const [text, setText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  
  const { streamRequest, data, isLoading } = useStream();

  const handleTranslate = () => {
    if (!text.trim()) return;
    streamRequest("/api/tools/translate", { text, targetLanguage });
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
            <Languages className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Universal Translator</h1>
            <p className="text-muted-foreground">Accurate, context-aware translations in seconds.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-stretch">
          {/* Source */}
          <Card className="flex-1 flex flex-col border-white/5">
            <div className="p-3 border-b border-white/5 bg-white/[0.02]">
              <span className="font-medium text-sm text-muted-foreground ml-2">Auto-detect</span>
            </div>
            <CardContent className="p-0">
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to translate..."
                className="h-64 border-0 focus-visible:ring-0 rounded-none bg-transparent resize-none p-5 text-lg"
              />
            </CardContent>
          </Card>

          {/* Center Actions */}
          <div className="flex lg:flex-col items-center justify-center gap-4 py-4 lg:py-0">
            <Button size="icon" variant="outline" className="rounded-full w-12 h-12" disabled>
              <ArrowRightLeft className="w-5 h-5 lg:rotate-0 rotate-90 text-muted-foreground" />
            </Button>
            <Button onClick={handleTranslate} isLoading={isLoading} className="w-full lg:w-32">
              Translate
            </Button>
          </div>

          {/* Target */}
          <Card className="flex-1 flex flex-col border-white/5 relative overflow-hidden">
            <div className="p-2 border-b border-white/5 bg-white/[0.02]">
              <select 
                value={targetLanguage} 
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="bg-transparent border border-white/10 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:border-primary cursor-pointer"
              >
                {LANGUAGES.map(l => <option key={l} value={l} className="bg-background">{l}</option>)}
              </select>
            </div>
            <CardContent className="p-5 flex-1 overflow-y-auto bg-primary/5 min-h-[16rem]">
              <div className="text-lg whitespace-pre-wrap">
                {data}{isLoading && " ▋"}
                {!data && !isLoading && <span className="text-muted-foreground opacity-50">Translation will appear here...</span>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
