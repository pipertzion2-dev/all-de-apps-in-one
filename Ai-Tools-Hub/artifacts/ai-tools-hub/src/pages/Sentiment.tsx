import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Smile, Frown, Meh, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAnalyzeSentiment } from "@workspace/api-client-react";

export default function SentimentPage() {
  const [text, setText] = useState("");
  const { mutateAsync, data, isPending } = useAnalyzeSentiment();

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    await mutateAsync({ data: { text } });
  };

  const getSentimentColor = (sentiment?: string) => {
    switch(sentiment) {
      case 'positive': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'negative': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'neutral': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'mixed': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      default: return 'text-muted-foreground';
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch(sentiment) {
      case 'positive': return <Smile className="w-12 h-12" />;
      case 'negative': return <Frown className="w-12 h-12" />;
      default: return <Meh className="w-12 h-12" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Sentiment Analyzer</h1>
            <p className="text-muted-foreground">Uncover the emotional tone hidden in text.</p>
          </div>
        </div>

        <Card className="border-white/5">
          <CardContent className="p-6">
            <Textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter customer feedback, reviews, or any text..."
              className="min-h-[150px] mb-4 text-base"
            />
            <Button onClick={handleAnalyze} disabled={isPending} className="w-full bg-pink-600 hover:bg-pink-700 text-white border-0">
              {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Analyze Sentiment
            </Button>
          </CardContent>
        </Card>

        {data && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-white/5 overflow-hidden">
              <div className="p-8 flex flex-col md:flex-row items-center gap-8">
                <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${getSentimentColor(data.sentiment)}`}>
                  {getSentimentIcon(data.sentiment)}
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">Result</div>
                    <h2 className={`text-4xl font-display font-bold capitalize ${getSentimentColor(data.sentiment).split(' ')[0]}`}>
                      {data.sentiment}
                    </h2>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Confidence Score</div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${data.score * 100}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className={`h-full ${getSentimentColor(data.sentiment).split(' ')[1].replace('/10', '')}`}
                      />
                    </div>
                    <div className="text-right text-xs mt-1 text-muted-foreground">{Math.round(data.score * 100)}%</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-white/5 bg-white/[0.02] p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-white mb-3">Detected Emotions</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.emotions.map(e => (
                      <Badge key={e} variant="outline" className="text-sm py-1 px-3 bg-white/5">{e}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-3">Explanation</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{data.explanation}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
