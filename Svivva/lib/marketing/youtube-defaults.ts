/** Default competitive-intel channel for admin Orbit + marketing autopilot. */
export const ADMIN_DEFAULT_YOUTUBE_CHANNEL = "https://www.youtube.com/@StarterStory";

export const ADMIN_DEFAULT_YOUTUBE_HANDLE = "@StarterStory";

export const YOUTUBE_QUICK_CHANNELS = [
  {
    label: "@StarterStory",
    url: ADMIN_DEFAULT_YOUTUBE_CHANNEL,
    hint: "SaaS growth & indie founder playbooks",
  },
  {
    label: "Starter Story videos",
    url: "https://www.youtube.com/@StarterStory/videos",
    hint: "Full channel listing",
  },
] as const;

export function isStarterStoryChannelUrl(url: string): boolean {
  const normalized = url.trim().toLowerCase().replace(/\/+$/, "");
  return (
    normalized.includes("@starterstory") ||
    normalized.includes("/starterstory") ||
    normalized === ADMIN_DEFAULT_YOUTUBE_CHANNEL.toLowerCase()
  );
}
