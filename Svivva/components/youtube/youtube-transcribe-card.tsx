"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  ADMIN_DEFAULT_YOUTUBE_CHANNEL,
  YOUTUBE_QUICK_CHANNELS,
} from "@/lib/marketing/youtube-defaults";

type Props = {
  value: string;
  onChange: (url: string) => void;
  onSubmit: (url: string) => void;
  pending?: boolean;
  successMessage?: string | null;
  errorMessage?: string | null;
  title?: string;
  description?: string;
  submitLabel?: string;
  pendingLabel?: string;
  showCaptionPreviewLink?: boolean;
  compact?: boolean;
  id?: string;
};

export function YoutubeTranscribeCard({
  value,
  onChange,
  onSubmit,
  pending = false,
  successMessage,
  errorMessage,
  title = "YouTube transcript",
  description = "Paste a video or @channel URL. Public captions become app seeds — same flow as uploading a PDF.",
  submitLabel = "Transcribe → Seeds",
  pendingLabel = "Transcribing…",
  showCaptionPreviewLink = true,
  compact = false,
  id = "youtube-transcribe",
}: Props) {
  const [focused, setFocused] = useState(false);

  function submitUrl(url: string) {
    const trimmed = url.trim();
    if (trimmed.length < 8 || pending) return;
    onChange(trimmed);
    onSubmit(trimmed);
  }

  return (
    <Card
      id={id}
      className={`border-dashed border-2 border-border/70 hover:border-[#6B2C4E]/50 transition-colors scroll-mt-24 ${
        focused ? "border-[#6B2C4E]/40" : ""
      }`}
      data-testid="card-youtube-transcript"
    >
      <CardContent className={compact ? "p-5 space-y-3" : "p-8 space-y-4"}>
        {!compact && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#6B2C4E]/10 flex items-center justify-center mx-auto">
              <Youtube className="w-8 h-8 text-[#6B2C4E]" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        )}

        {compact && (
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-[#6B2C4E] flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 justify-center">
          {YOUTUBE_QUICK_CHANNELS.map((chip) => (
            <button
              key={chip.url}
              type="button"
              disabled={pending}
              title={chip.hint}
              onClick={() => submitUrl(chip.url)}
              className="text-xs px-3 py-1.5 rounded-full border border-[#6B2C4E]/30 bg-[#6B2C4E]/5 hover:bg-[#6B2C4E]/15 transition-colors disabled:opacity-50"
              data-testid={`chip-youtube-${chip.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
            >
              {chip.label}
            </button>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={() => onChange(ADMIN_DEFAULT_YOUTUBE_CHANNEL)}
            className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-muted/50 transition-colors disabled:opacity-50"
          >
            Paste @StarterStory
          </button>
        </div>

        <form
          className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
          onSubmit={(e) => {
            e.preventDefault();
            submitUrl(value);
          }}
        >
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="youtube.com/watch?v=… or youtube.com/@StarterStory"
            className="flex-1"
            disabled={pending}
            data-testid="input-youtube-url"
          />
          <Button
            type="submit"
            className="gap-2 bg-[#6B2C4E] hover:bg-[#6B2C4E]/90"
            disabled={pending || value.trim().length < 8}
            data-testid="button-youtube-transcribe"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Youtube className="w-4 h-4" />
            )}
            {pending ? pendingLabel : submitLabel}
          </Button>
        </form>

        {showCaptionPreviewLink && (
          <p className="text-xs text-muted-foreground text-center">
            Captions only?{" "}
            <Link href="/tools/youtube-caption-preview" className="text-[#5B8DA8] hover:underline">
              Free YouTube Caption Preview
            </Link>{" "}
            — no signup.
          </p>
        )}

        {successMessage && (
          <p className="text-sm text-muted-foreground text-center" data-testid="text-youtube-success">
            {successMessage}
          </p>
        )}
        {errorMessage && (
          <p className="text-sm text-red-500 text-center" data-testid="text-youtube-error">
            {errorMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
