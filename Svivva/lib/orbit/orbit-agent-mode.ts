/**
 * Cursor Cloud Agent mode — Orbit uses the agent session's AI model instead of
 * external API keys. The agent generates content and POSTs to /api/orbit/ingest-content
 * via `npm run orbit:ingest -- path/to/content.json` (admin auth, no new keys).
 */

export const ORBIT_AGENT_PROVIDER_LABEL = "Cursor Cloud Agent (this session's AI)";
export const ORBIT_AGENT_MODEL = "cursor-agent";

export function isOrbitAgentSession(): boolean {
  return !!(
    process.env.CURSOR_AGENT === "1" ||
    process.env.CURSOR_CLOUD_AGENT === "1" ||
    process.env.CURSOR_BC_ID?.trim()
  );
}
