import os from "os";

function scoreLanCandidate(addr: string): number {
  if (addr.startsWith("192.168.")) return 100;
  if (addr.startsWith("10.")) return 80;
  if (addr.startsWith("172.")) {
    const octets = addr.split(".").map(Number);
    const second = octets[1];
    if (second === 17) return 10;
    if (second !== undefined && second >= 16 && second <= 31) return 50;
    return 40;
  }
  return 20;
}

/** Best-effort LAN IPv4 for “open on phone” hints (dev only). */
export function pickLanIPv4(): string | null {
  const nets = os.networkInterfaces();
  const candidates: string[] = [];
  for (const list of Object.values(nets)) {
    for (const ni of list || []) {
      const isV4 = ni.family === "IPv4" || String(ni.family) === "4";
      if (isV4 && !ni.internal && ni.address) candidates.push(ni.address);
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => scoreLanCandidate(b) - scoreLanCandidate(a));
  return candidates[0] ?? null;
}
