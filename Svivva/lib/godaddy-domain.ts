/**
 * Normalize user input into an apex domain GoDaddy's API expects (e.g. example.com).
 * Strips protocol, path, www., and lowercases.
 */
export function normalizeGodaddyDomain(raw: string): string | null {
  let s = raw.trim().toLowerCase();
  if (!s) return null;
  s = s.replace(/^https?:\/\//, "");
  s = s.split("/")[0] ?? "";
  s = s.split(":")[0] ?? "";
  s = s.replace(/^www\./, "");
  s = s.replace(/\.$/, "");
  if (!s) return null;
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(s)) {
    return null;
  }
  return s;
}
