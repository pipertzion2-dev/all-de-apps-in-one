import { useState, useCallback } from "react";

export function useStream() {
  const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamRequest = useCallback(async (url: string, body: any) => {
    setIsLoading(true);
    setData("");
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Request failed');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        
        // Keep the last partial chunk in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.done) break;
              if (parsed.content) {
                setData(prev => prev + parsed.content);
              }
            } catch (e) {
              console.warn("Failed to parse SSE chunk:", jsonStr);
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Stream error:", err);
      setError(err.message || "An error occurred while generating.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, streamRequest, reset: () => setData("") };
}
