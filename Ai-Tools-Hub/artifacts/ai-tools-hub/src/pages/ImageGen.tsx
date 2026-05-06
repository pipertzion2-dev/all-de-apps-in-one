import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Image as ImageIcon, Download, Loader2 } from "lucide-react";
import { useGenerateOpenaiImage } from "@workspace/api-client-react";

export default function ImageGenPage() {
  const [prompt, setPrompt] = useState("");
  const { mutateAsync, data, isPending } = useGenerateOpenaiImage();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    await mutateAsync({ data: { prompt, size: "1024x1024" } });
  };

  const handleDownload = () => {
    if (!data?.b64_json) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${data.b64_json}`;
    link.download = "generated-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">AI Image Generator</h1>
            <p className="text-muted-foreground">Turn your imagination into stunning visuals.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-5 border-white/5 h-fit">
            <CardContent className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Image Prompt</label>
                <Textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to see in detail..."
                  className="min-h-[150px]"
                />
              </div>
              <Button onClick={handleGenerate} disabled={isPending} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white border-0 h-12">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Wand2 className="w-5 h-5 mr-2" />}
                Generate Masterpiece
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-7 border-white/5 min-h-[400px] flex items-center justify-center bg-black/40 overflow-hidden relative group">
            {isPending ? (
              <div className="flex flex-col items-center text-cyan-400">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="font-medium animate-pulse">Dreaming up your vision...</p>
              </div>
            ) : data?.b64_json ? (
              <>
                <img 
                  src={`data:image/png;base64,${data.b64_json}`} 
                  alt="Generated" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button onClick={handleDownload} variant="secondary" className="gap-2">
                    <Download className="w-4 h-4" /> Download Full Res
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center opacity-50">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p>Your generated image will appear here</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// Ensure Wand2 is imported for the button
import { Wand2 } from "lucide-react";
